"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import  {supabase} from "@/lib/supabaseClient";
interface FormData {
  fullName: string;
  email: string;
  mobileNo: string;
  password: string;
  confirmPassword: string;
  businessType: "individual" | "company";
  state: string;
  district: string;
  city: string;
  preferredLanguage: "english" | "tamil" | "hindi";
  accountType:
    | "silkseller"
    | "weaver"
    | "manufacturer"
    | "customer"
    | "retailer"
    | "wholesaler";
  accept: boolean;
}
export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [roleErrors, setRoleErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    mobileNo: "",
    password: "",
    confirmPassword: "",
    businessType: "individual",
    state: "",
    district: "",
    city: "",
    preferredLanguage: "english",
    accountType: "silkseller",
    accept: false,
  });
  const passwordsMatch = formData.password === formData.confirmPassword;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [roleForm, setRoleForm] = useState<any>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required";
    } else if (formData.mobileNo.length !== 10) {
      newErrors.mobileNo = "Mobile number must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.district.trim()) newErrors.district = "District is required";
    if (!formData.city.trim()) newErrors.city = "City is required";

    if (!formData.accept) {
      newErrors.accept = "You must accept the terms";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const validateRoleForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (formData.accountType === "customer") {
      if (!roleForm.address?.trim()) newErrors.address = "Address is required";
      if (!roleForm.gender) newErrors.gender = "Gender is required";
    }
    if (formData.accountType === "silkseller") {
      if (!roleForm.materialType?.trim())
        newErrors.materialType = "Material type is required";
      if (!roleForm.capacity?.trim())
        newErrors.capacity = "capacity is required";
      if (!roleForm.warehouse?.trim())
        newErrors.warehouse = "warehouse is required";
    }
    if (formData.accountType === "weaver") {
      if (!roleForm.loomType?.trim())
        newErrors.loomType = "Loom type is required";
      if (!roleForm.experience?.trim())
        newErrors.experience = "Experience is required";
      if (!roleForm.production?.trim())
        newErrors.production = "Production is required";
    }
    if (formData.accountType === "manufacturer") {
      if(!roleForm.processingType?.trim())
      {
        newErrors.processingType="Processing type is required";
      }
      if (!roleForm.factoryAddress?.trim())
        newErrors.factoryAddress = "Factory Address is required";
      if (!roleForm.gst?.trim()) newErrors.gst = "Gst is required";
      if (!roleForm.scale?.trim()) newErrors.scale = "Scale is required";
    }
    if (formData.accountType === "wholesaler") {
      if (!roleForm.bulkCapacity?.trim())
        newErrors.bulkCapacity = "Capacity is required";
      if (!roleForm.regions?.trim()) newErrors.regions = "Region is required";
      if (!roleForm.gst?.trim()) newErrors.gst = "GST is required";
    }
    if (formData.accountType === "retailer") {
      if (!roleForm.shopType?.trim())
        newErrors.shopType = "Shop type is required";
      if (!roleForm.storeAddress?.trim())
        newErrors.storeAddress = "Store Address is required";
      if (!roleForm.delivery?.trim())
        newErrors.delivery = "Delivery is required";
    }
    setRoleErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleClick = () => {
    const isValid = validateForm();
    if (!isValid) return;
    setStep(2);
  };
  const handleBack = () => {
    setStep(1);
  };
const handleSubmit = async () => {
  const isValid = validateRoleForm();
  if (!isValid) return;

  try {
  
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      alert(authError.message);
      return;
    }

    if (!authData.user) {
      alert("Auth user not created");
      return;
    }

    const userId = authData.user.id; 


    const { error: userInsertError } = await supabase.from("users").insert([
      {
        id: userId, 
        full_name: formData.fullName,
        email: formData.email,
        mobile: formData.mobileNo,
        business_type: formData.businessType,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        preferred_language: formData.preferredLanguage,
        accepted_terms: formData.accept,
        role: formData.accountType,
        account_type: formData.accountType,
      },
    ]);

    if (userInsertError) {
      alert("Failed to save user profile");
      console.error(userInsertError);
      return;
    }


    let roleError = null;

    if (formData.accountType === "silkseller") {
      const { error } = await supabase.from("silksellers").insert([
        {
          user_id: userId,
          raw_material_type: roleForm.materialType,
          quantity_capacity: Number(roleForm.capacity),
          business_reg_no: roleForm.registration || null,
          warehouse_location: roleForm.warehouse,
        },
      ]);
      roleError = error;
    }

    if (formData.accountType === "weaver") {
      const { error } = await supabase.from("weavers").insert([
        {
          user_id: userId,
          loom_type: roleForm.loomType,
          monthly_production: Number(roleForm.production),
          experience_years: Number(roleForm.experience),
          work_type: roleForm.workType,
        },
      ]);
      roleError = error;
    }

    if (formData.accountType === "manufacturer") {
      const { error } = await supabase.from("manufacturers").insert([
        {
          user_id: userId,
          processing_type: roleForm.processingType,
          factory_address: roleForm.factoryAddress,
          gst_number: roleForm.gst,
          production_scale: roleForm.scale,
        },
      ]);
      roleError = error;
    }

    if (formData.accountType === "wholesaler") {
      const { error } = await supabase.from("wholesalers").insert([
        {
          user_id: userId,
          bulk_order_capacity: Number(roleForm.bulkCapacity),
          distribution_regions: roleForm.regions,
          gst_number: roleForm.gst,
        },
      ]);
      roleError = error;
    }

    if (formData.accountType === "retailer") {
      const { error } = await supabase.from("retailers").insert([
        {
          user_id: userId,
          shop_type: roleForm.shopType,
          store_address: roleForm.storeAddress,
          delivery_capabilities: roleForm.delivery,
        },
      ]);
      roleError = error;
    }

    if (formData.accountType === "customer") {
      const { error } = await supabase.from("customers").insert([
        {
          user_id: userId,
          shipping_address: roleForm.address,
          gender: roleForm.gender,
        },
      ]);
      roleError = error;
    }

    if (roleError) {
      alert("Failed to save role details");
      console.error(roleError);
      return;
    }

    alert("Registration Successful!");
    router.push(`/dashboard/${formData.accountType}`);

  } catch (err) {
    console.error("Unexpected error:", err);
    alert("Something went wrong");
  }
};

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center items-center p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Create Account(Step{step})
        </h1>
        {step === 1 && (
          <>
            <div className="space-y-3">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="w-full border p-2 rounded"
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm">{errors.fullName}</p>
              )}
              <label>Email</label>
              <input
                type="text"
                placeholder="Email"
                className="w-full border p-2 rounded"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
              <label>Mobile Number</label>
              <input
                type="text"
                placeholder="Mobileno"
                value={formData.mobileNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobileNo: e.target.value,
                  }))
                }
                className="w-full border p-2 rounded"
              />
              {errors.mobileNo && (
                <p className="text-red-500 text-sm">{errors.mobileNo}</p>
              )}
              <div className="relative">
                <label>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded pr-10 appearance-none"
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 cursor-pointer text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
              <div className="relative">
                <label>Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full border p-2 rounded appearance-none"
                />

                <div
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2  cursor-pointer text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
              <label>Business Type</label>
              <select
                className="w-full border p-2 rounded"
                value={formData.businessType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    businessType: e.target.value as "individual" | "company",
                  }))
                }
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              <label>State</label>
              <input
                type="text"
                placeholder="State"
                className="w-full border p-2 rounded"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    state: e.target.value,
                  }))
                }
              />
              {errors.state && (
                <p className="text-red-500 text-sm">{errors.state}</p>
              )}
              <label>District</label>
              <input
                type="text"
                placeholder="District"
                className="w-full border p-2 rounded"
                value={formData.district}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    district: e.target.value,
                  }))
                }
              />
              {errors.district && (
                <p className="text-red-500 text-sm">{errors.district}</p>
              )}
              <label>City</label>
              <input
                type="text"
                placeholder="city"
                className="w-full border p-2 rounded"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
              />
              {errors.city && (
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
              <label>Preferred Language</label>
              <select
                className="w-full border p-2 rounded"
                value={formData.preferredLanguage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preferredLanguage: e.target.value as
                      | "english"
                      | "tamil"
                      | "hindi",
                  }))
                }
              >
                <option value="english">English</option>
                <option value="tamil">Tamil</option>
                <option value="hindi">Hindi</option>
              </select>
              <div className="-space-y-2">
                <label>Account Type</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountType: e.target.value as
                        | "silkseller"
                        | "wholesaler"
                        | "retailer"
                        | "customer"
                        | "manufacturer"
                        | "weaver",
                    }))
                  }
                >
                  <option value="silkseller">Silk Seller</option>
                  <option value="weaver">Weaver</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="retailer">Retailer</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={formData.accept}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accept: e.target.checked,
                  }))
                }
              />
              <p className="text-sm">I accept the terms and conditions</p>
            </div>
            {errors.accept && (
              <p className="text-red-500 text-sm">{errors.accept}</p>
            )}
            <div>
              <button
                className="w-full bg-black text-white py-2 rounded mt-5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleClick}
              >
                Next
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-center mb-4">
              {formData.accountType.toUpperCase()}Details
            </h2>
            {formData.accountType === "customer" && (
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Shipping Address"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, address: e.target.value })
                  }
                />
                {roleErrors.address && (
                  <p className="text-red-500 text-sm">{roleErrors.address}</p>
                )}

                <select
                  className="w-full border p-2 rounded"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, gender: e.target.value })
                  }
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                {roleErrors.gender && (
                  <p className="text-red-500 text-sm">{roleErrors.gender}</p>
                )}
              </div>
            )}
            {formData.accountType === "silkseller" && (
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Material Type"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, materialType: e.target.value })
                  }
                />
                {roleErrors.materialType && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.materialType}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Monthly Capacity (kg)"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, capacity: e.target.value })
                  }
                />
                {roleErrors.capacity && (
                  <p className="text-red-500 text-sm">{roleErrors.capacity}</p>
                )}
                      <input
                  className="w-full border p-2 rounded"
                  placeholder="Business Registration Number (optional)"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, registration: e.target.value })
                  }
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Warehouse Location"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, warehouse: e.target.value })
                  }
                />
                {roleErrors.warehouse && (
                  <p className="text-red-500 text-sm">{roleErrors.warehouse}</p>
                )}
              </div>
            )}
            {formData.accountType === "weaver" && (
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Loom type"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, loomType: e.target.value })
                  }
                />
                {roleErrors.loomType && (
                  <p className="text-red-500 text-sm">{roleErrors.loomType}</p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Experience (years)"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, experience: e.target.value })
                  }
                />
                {roleErrors.experience && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.experience}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Monthly Production"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, production: e.target.value })
                  }
                />
                {roleErrors.production && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.production}
                  </p>
                )}
              </div>
            )}
            {formData.accountType === "manufacturer" && (
              <div className="space-y-3">
                 <input
                  className="w-full border p-2 rounded"
                  placeholder="Processing type"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, processingType: e.target.value })
                  }
                />
                {roleErrors.processingType && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.processingType}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Factory Address"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, factoryAddress: e.target.value })
                  }
                />
                {roleErrors.factoryAddress && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.factoryAddress}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="GST Number"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, gst: e.target.value })
                  }
                />
                {roleErrors.gst && (
                  <p className="text-red-500 text-sm">{roleErrors.gst}</p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Production Scale"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, scale: e.target.value })
                  }
                />
                {roleErrors.scale && (
                  <p className="text-red-500 text-sm">{roleErrors.scale}</p>
                )}
              </div>
            )}
            {formData.accountType === "wholesaler" && (
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Bulk Order Capacity"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, bulkCapacity: e.target.value })
                  }
                />
                {roleErrors.bulkCapacity && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.bulkCapacity}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Distribution regions"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, regions: e.target.value })
                  }
                />
                {roleErrors.regions && (
                  <p className="text-red-500 text-sm">{roleErrors.regions}</p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="GST Number"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, gst: e.target.value })
                  }
                />
                {roleErrors.gst && (
                  <p className="text-red-500 text-sm">{roleErrors.gst}</p>
                )}
              </div>
            )}
            {formData.accountType === "retailer" && (
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Shop Type (Online/Offline)"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, shopType: e.target.value })
                  }
                />
                {roleErrors.shopType && (
                  <p className="text-red-500 text-sm">{roleErrors.shopType}</p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Store Address"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, storeAddress: e.target.value })
                  }
                />
                {roleErrors.storeAddress && (
                  <p className="text-red-500 text-sm">
                    {roleErrors.storeAddress}
                  </p>
                )}
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Delivery Capability"
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, delivery: e.target.value })
                  }
                />
                {roleErrors.delivery && (
                  <p className="text-red-500 text-sm">{roleErrors.delivery}</p>
                )}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                className="w-full bg-black text-white py-2 rounded mt-6"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="w-full bg-black text-white py-2 rounded mt-6"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
