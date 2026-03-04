"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface KYCCameraCaptureProps {
    onCapture: (imageSrc: string, matchScore: number, livenessVerified: boolean, notes?: string) => void;
    idCardImage?: string | null;
}

export const KYCCameraCapture: React.FC<KYCCameraCaptureProps> = ({ onCapture, idCardImage }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [status, setStatus] = useState<string>("Initializing camera...");
    const [error, setError] = useState<string | null>(null);
    const [livenessStep, setLivenessStep] = useState<number>(0); // 0: detect, 1: blink, 2: success
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isStarted, setIsStarted] = useState(false);

    // Load models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models/';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
                ]);
                setIsModelLoaded(true);
                setStatus("Ready to verify!");
            } catch (err) {
                console.error("Failed to load face-api models:", err);
                setError("Failed to load AI models. Please check your connection.");
            }
        };
        loadModels();
    }, []);

    const isAnalyzing = useRef(false);

    const captureAndVerify = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setCapturedImage(imageSrc);
        setIsVerifying(true);
        setStatus("Processing selfie...");

        // Helper to ensure image is truly loaded and ready for AI
        const loadImage = async (src: string): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = () => reject(new Error("Failed to load image for AI analysis"));
                img.src = src;
            });
        };

        try {
            // 1. Load and detect selfie
            const selfieImg = await loadImage(imageSrc);
            const selfieResult = await faceapi.detectSingleFace(selfieImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!selfieResult) {
                console.error("KYC: Could not detect face in selfie");
                setError("Face not found in selfie. Please ensure good lighting.");
                setCapturedImage(null);
                setLivenessStep(0);
                return;
            }

            let matchScore = 0;
            let notes = "Selfie detected.";

            if (idCardImage) {
                setStatus("Analyzing ID card...");

                try {
                    const idImg = await loadImage(idCardImage);

                    // Multi-pass detection for ID card using detectAllFaces to be more robust
                    let idFaces = [];
                    let detectionStrategy = "";

                    // Pass 1: SsdMobilenetv1 
                    idFaces = await faceapi.detectAllFaces(idImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                        .withFaceLandmarks().withFaceDescriptors();
                    detectionStrategy = "SSD";

                    // Pass 2: Tiny (Balanced)
                    if (idFaces.length === 0) {
                        idFaces = await faceapi.detectAllFaces(idImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 }))
                            .withFaceLandmarks().withFaceDescriptors();
                        detectionStrategy = "Tiny(416)";
                    }

                    // Pass 3: Tiny (Maximum sensitivity)
                    if (idFaces.length === 0) {
                        idFaces = await faceapi.detectAllFaces(idImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.1 }))
                            .withFaceLandmarks().withFaceDescriptors();
                        detectionStrategy = "Tiny(608/0.1)";
                    }

                    if (idFaces.length > 0) {
                        // Pick the face with the highest detection score
                        const bestFace = idFaces.reduce((prev, current) => (prev.detection.score > current.detection.score) ? prev : current);

                        const distance = faceapi.euclideanDistance(selfieResult.descriptor, bestFace.descriptor);

                        // Match score mapping
                        if (distance < 0.6) {
                            matchScore = Math.round(100 - (distance * 66.6)); // 0->100, 0.6->60
                        } else if (distance < 0.8) {
                            matchScore = Math.round(60 - ((distance - 0.6) * 200)); // 0.6->60, 0.8->20
                        } else {
                            matchScore = Math.max(0, Math.round(20 - ((distance - 0.8) * 100))); // 0.8->20, 1.0->0
                        }
                        matchScore = Math.min(100, Math.max(0, matchScore));
                        notes = `Matched using ${detectionStrategy}. Distance: ${distance.toFixed(3)}. Faces found: ${idFaces.length}.`;
                    } else {
                        console.warn("KYC: No face found on ID card after all passes");
                        notes = "Failed: Face not found on ID card after 3 passes.";
                        setError("Could not find a face on your ID card. Please ensure the portrait is clear and well-lit.");
                    }
                } catch (imgLoadErr) {
                    console.error("KYC: ID Image Load Error:", imgLoadErr);
                    notes = "Error: ID image failed to load.";
                    setError("Could not read ID card image. Please re-upload.");
                }
            }

            onCapture(imageSrc, matchScore, true, notes);
            setStatus("Verification logic complete!");
        } catch (err: any) {
            console.error("KYC: General verification error:", err);
            setError(`AI Error: ${err.message || "Unknown error"}`);
        } finally {
            setIsVerifying(false);
        }
    }, [idCardImage, onCapture]);

    const handleLivenessCheck = useCallback(async () => {
        if (!webcamRef.current || !isModelLoaded || !isStarted || isAnalyzing.current || capturedImage || livenessStep >= 2) return;

        const video = webcamRef.current.video;
        if (!video || video.paused || video.ended || video.readyState !== 4) return;

        isAnalyzing.current = true;
        try {
            const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceExpressions();

            if (result) {
                if (livenessStep === 0) {
                    setStatus("Face detected! Please blink or smile.");
                    setLivenessStep(1);
                } else if (livenessStep === 1) {
                    if (result.expressions.happy > 0.5) {
                        setStatus("Liveness verified!");
                        setLivenessStep(2);
                        captureAndVerify();
                    }
                }
            }
        } catch (err) {
            console.error("Liveness check error:", err);
        } finally {
            isAnalyzing.current = false;
        }
    }, [isModelLoaded, isStarted, livenessStep, capturedImage, captureAndVerify]);

    // Optimized Detection Loop
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const loop = async () => {
            if (isModelLoaded && isStarted && !capturedImage && livenessStep < 2) {
                await handleLivenessCheck();
                timeout = setTimeout(loop, 800);
            }
        };

        if (isModelLoaded && isStarted && !capturedImage && livenessStep < 2) {
            loop();
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isModelLoaded, isStarted, capturedImage, livenessStep, handleLivenessCheck]);

    const reset = () => {
        setCapturedImage(null);
        setLivenessStep(0);
        setError(null);
        setStatus("Ready! Position your face.");
    };

    return (
        <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-950">
                {!isStarted ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 mb-2">
                            <Camera className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Selfie Verification</h4>
                            <p className="text-[10px] text-slate-400 max-w-[200px]">We'll use your camera to match your face with the ID provided. AI matching happens locally.</p>
                        </div>
                        <Button
                            onClick={() => {
                                if (!idCardImage) {
                                    alert("Please upload your Gov ID Front first so we can match it with your selfie.");
                                    return;
                                }
                                setIsStarted(true);
                            }}
                            disabled={!isModelLoaded}
                            className={`${!idCardImage ? 'bg-slate-700' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-xl px-8 font-black uppercase tracking-widest text-[10px]`}
                        >
                            {!isModelLoaded ? "Initializing AI..." : !idCardImage ? "Upload ID First" : "Start Camera"}
                        </Button>
                    </div>
                ) : !capturedImage ? (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover mirror"
                            videoConstraints={{ facingMode: "user" }}
                        />
                        <div className="absolute inset-0 border-4 border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-64 border-2 border-white/40 rounded-[3rem]" />
                        </div>
                    </>
                ) : (
                    <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
                )}

                {isStarted && (
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 border border-white/10">
                        {error ? (
                            <AlertCircle className="h-5 w-5 text-rose-400" />
                        ) : livenessStep === 2 ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                            <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                        )}
                        <div className="flex flex-col">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${error ? 'text-rose-100' : 'text-white'}`}>
                                {error || status}
                            </p>
                            {!error && status === "Verification logic complete!" && (
                                <p className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Click 'Save Profile' below to finish</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                {capturedImage && (
                    <Button
                        variant="ghost"
                        onClick={reset}
                        className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-[10px] uppercase font-black"
                    >
                        <RefreshCw className="h-3 w-3 mr-2" /> Redo Capture
                    </Button>
                )}
            </div>
        </div>
    );
};
