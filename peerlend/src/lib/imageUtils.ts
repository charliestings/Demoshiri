/**
 * Compresses an image file or dataURL using HTML5 Canvas.
 */
export const compressImage = async (
    source: File | string,
    maxWidth: number = 1200,
    quality: number = 0.7
): Promise<File | string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG
            if (typeof source === 'string' && source.startsWith('data:')) {
                // Return as DataURL if input was DataURL
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            } else {
                // Return as File if input was File
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas toBlob failed"));
                            return;
                        }
                        const name = (source as File).name || 'compressed-image.jpg';
                        const lastDotIndex = name.lastIndexOf('.');
                        const baseName = lastDotIndex !== -1 ? name.substring(0, lastDotIndex) : name;
                        const file = new File([blob], `${baseName}.jpg`, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(file);
                    },
                    'image/jpeg',
                    quality
                );
            }
        };

        img.onerror = () => reject(new Error("Failed to load image for compression"));

        if (typeof source === 'string') {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
};
