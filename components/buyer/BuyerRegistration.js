import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import logo from "../../assets/logo.svg";
import Notification from "../global/Notification";
import { useTranslation } from "react-i18next";

const BuyerRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    address: "",
    crNumber: "",
    crLicenseFile: null,
    bankAccount: "",
    bankName: "",
    accountHolderName: "",
  });

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationContent, setNotificationContent] = useState({
    title: "",
    message: "",
  });

  const navigate = useNavigate();
  const { t } = useTranslation();

  const showNotification = (title, message) => {
    setNotificationContent({ title, message });
    setIsNotificationOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prevData) => ({
        ...prevData,
        crLicenseFile: e.target.files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      showNotification("Authentication Required", "Please log in first.");
      navigate("/user-login");
      return;
    }

    const fullPhoneNumber = localStorage.getItem("userPhone");
    if (!fullPhoneNumber) {
      showNotification("Error", "Phone number not found. Please log in again.");
      navigate("/user-login");
      return;
    }

    const uid = user.uid || uuidv4();
    const role = "buyer";

    try {
      let crLicenseURL = "";
      if (formData.crLicenseFile) {
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `crLicenses/${uid}-${formData.crLicenseFile.name}`
        );
        await uploadBytes(fileRef, formData.crLicenseFile);
        crLicenseURL = await getDownloadURL(fileRef);
      }

      await setDoc(
        doc(db, "users", uid),
        {
          role,
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: fullPhoneNumber,
          buyerId: uid,
          address: formData.address,
          crNumber: formData.crNumber,
          crLicenseURL,
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
        },
        { merge: true }
      );

      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      showNotification("Success", "Registration complete! Redirecting...");
      navigate("/");

      setFormData({
        name: "",
        surname: "",
        email: "",
        address: "",
        crNumber: "",
        crLicenseFile: null,
        bankAccount: "",
        bankName: "",
        accountHolderName: "",
      });
    } catch (error) {
      console.error("Error adding buyer to Firestore:", error);
      showNotification("Error", "Registration failed. Try again.");
    }
  };

  return (
    <div
      className='d-flex flex-column flex-lg-row'
      style={{
        minHeight: "calc(100vh - 140px)",
        width: "100%",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        display: "-webkit-box", // Safari compatibility
      }}
    >
      {/* Left Column */}
      <div
        className='d-flex flex-column align-items-center justify-content-center w-100'
        style={{
          flex: 1,
          backgroundColor: "#f7f7f7",
          padding: "0.5rem", // Reduced padding
          boxSizing: "border-box",
        }}
      >
        <div className='text-center mb-3'>
          <img
            src={logo}
            alt='Logo'
            style={{
              width: "50px", // Smaller logo
              marginBottom: "6px",
              maxWidth: "100%",
            }}
          />
          <h2
            style={{
              color: "#2d6a4f",
              fontWeight: "bold",
              fontSize: "0.8rem", // Smaller heading
            }}
          >
            {t("buyer_registration.title")}
          </h2>
        </div>

        <Container
          className='p-3 border rounded shadow-sm bg-white w-100'
          style={{ maxWidth: "350px", boxSizing: "border-box" }} // Smaller form width
        >
          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-2'>
              <div className='d-flex gap-2'>
                <Form.Control
                  type='text'
                  placeholder={t("buyer_registration.name")}
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ fontSize: "0.8rem", height: "30px", width: "50%" }} // Adjust width for equal spacing
                />
                <Form.Control
                  type='text'
                  placeholder={t("buyer_registration.surname")}
                  name='surname'
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                  style={{ fontSize: "0.8rem", height: "30px", width: "50%" }}
                />
              </div>
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='email'
                placeholder={t("buyer_registration.email")}
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                placeholder={t("buyer_registration.address")}
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                placeholder={t("buyer_registration.crNumber")}
                name='crNumber'
                value={formData.crNumber}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Form.Group className='mb-2'>
              <div className='d-flex align-items-center'>
                <input
                  type='file'
                  id='fileUpload'
                  onChange={handleFileChange}
                  required
                  style={{ display: "none" }} // Hide the default input
                />
                <Button
                  variant='outline-secondary' // Default neutral color
                  onClick={() => document.getElementById("fileUpload").click()}
                  style={{
                    fontSize: "0.8rem",
                    height: "30px",
                    padding: "2px 10px",
                    marginRight: "10px",
                    borderColor: "#6c757d", // Neutral border
                    color: "#495057", // Neutral text color
                    transition: "all 0.3s ease-in-out", // Smooth hover effect
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#198754"; // Green hover (Bootstrap "success" color)
                    e.target.style.color = "#fff"; // White text on hover
                    e.target.style.borderColor = "#198754"; // Green border
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent"; // Return to original state
                    e.target.style.color = "#495057"; // Restore text color
                    e.target.style.borderColor = "#6c757d"; // Restore border
                  }}
                >
                  {t("buyer_registration.choose_file")}
                </Button>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#495057",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    maxWidth: "150px",
                  }}
                >
                  {formData.crLicenseFile
                    ? formData.crLicenseFile.name
                    : t("buyer_registration.no_file_chosen")}
                </span>
              </div>
              <Form.Text className='text-muted' style={{ fontSize: "0.7rem" }}>
                {t("buyer_registration.upload_cr_license")}
              </Form.Text>
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                placeholder={t("buyer_registration.bank_account")}
                name='bankAccount'
                value={formData.bankAccount}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                placeholder={t("buyer_registration.bank_name")}
                name='bankName'
                value={formData.bankName}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Form.Group className='mb-2'>
              <Form.Control
                type='text'
                placeholder={t("buyer_registration.account_holder")}
                name='accountHolderName'
                value={formData.accountHolderName}
                onChange={handleInputChange}
                required
                style={{ fontSize: "0.8rem", height: "30px" }}
              />
            </Form.Group>

            <Button
              variant='success'
              type='submit'
              className='w-100'
              style={{
                maxWidth: "250px", // Smaller button
                margin: "0 auto",
                display: "block",
                fontSize: "0.8rem", // Smaller button text
                height: "32px", // Compact button height
              }}
            >
              {t("buyer_registration.continue")}
            </Button>
          </Form>

          <Notification
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            title={notificationContent.title}
            message={notificationContent.message}
            duration={1000}
          />
        </Container>
      </div>

      {/* Right Column */}
      <div
        className='d-none d-lg-block'
        style={{
          flex: 1,
          background: "linear-gradient(to right, #f7f7f7, #2c6449)",
        }}
      ></div>
    </div>
  );
};

export default BuyerRegistration;
