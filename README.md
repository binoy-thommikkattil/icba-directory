# ⛪ Church Directory & Songbook Application

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)

A modern, secure, and fully-featured web application built with **Next.js**, **Firebase**, and **Google Gemini AI**. Designed specifically for churches, assemblies, and congregations to seamlessly manage their member directory, interactive songbook, emergency blood registry, and community communications.

---

## 🌟 Key Features

* **AI-Powered Songbook:** A dynamic, searchable library of hymns and choruses.
  * **Smart Input:** Admins can paste raw text or upload photos of physical songbooks (OCR).
  * **AI Translation & Transliteration:** Google Gemini automatically detects the language, generates English and Malayalam phonetics (sing-along scripts), translates meanings, and researches the story/history behind the song.
  * **Author Indexing:** Automatic normalization of composer names (e.g., "V Nagel") with a dedicated index to view songs by author.
* **Interactive Map & Address Picker:** Users can set their exact home addresses using a live map powered by the Google Places Autocomplete API, with a robust fallback to OpenStreetMap/Leaflet.
* **Smart Directory:** Searchable family and individual member directory with deduplication, fast loading, and secure data access.
* **Role-Based Access Control (RBAC):** * 👑 **Admins:** Can bulk upload via CSV, bypass approval queues, manage users, edit any family/song, and view the system audit log.
  * 👤 **Approved Members:** Can view the directory, export PDFs, post to noticeboards, and submit their own family details for admin approval.
  * ⏳ **Pending Users:** Restricted to a secure "Waiting Room" until an admin explicitly approves their account.
* **Emergency Blood Registry:** Quickly find willing blood donors within the congregation, complete with 1-click WhatsApp and phone call routing directly to the individual's personal mobile.
* **Professional PDF Generation:** Generate formatted PDF directory books, single family cards, or songbook sheets with automatic pagination, timestamps, and generator watermarks.
* **Image Cropping & Hybrid Storage:** Built-in UI for members to perfectly crop family profile pictures before saving. Includes a dual-save system that uploads high-res photos to Firebase Storage while creating low-res Base64 backups in the database.

---

## 🔌 APIs, Services & Pricing Guide

This application leverages several powerful APIs. For most small to medium-sized churches, **these services will remain 100% free** due to generous free tiers.

### 1. Google Gemini API (Gemini 2.5 Flash)
* **Used for:** Processing songbook uploads (OCR from images, formatting lyrics, translating, and generating Malayalam/English phonetics).
* **Free Tier:** 15 Requests Per Minute (RPM), 1,500 Requests Per Day, and 1 Million Tokens Per Minute (TPM).
* **Paid Tier (If exceeded):** ~$0.075 per 1 Million input tokens.
* **Expectation:** Unless you are uploading thousands of songs per day, this will be **completely free**.

### 2. Google Maps Platform (Maps JS, Places, Geocoding)
* **Used for:** The interactive map picker, searching for addresses via autocomplete, and pinning exact GPS coordinates.
* **Free Tier:** Google provides a **$200 recurring monthly credit** for all Maps usage.
* **Costs (deducted from the $200 credit):**
  * Dynamic Maps Load: ~$7.00 per 1,000 loads.
  * Places Autocomplete: ~$17.00 to $28.00 per 1,000 requests.
  * Geocoding: ~$5.00 per 1,000 requests.
* **Expectation:** The $200 credit covers roughly 10,000 to 20,000 map interactions per month. For a standard church app, this will remain **100% free**.

### 3. Firebase (Auth, Firestore, Storage)
* **Used for:** Database, user authentication, and storing profile/songbook images.
* **Free Tier (Spark Plan):** 50,000 document reads per day, 20,000 writes per day. 5GB of total file storage.
* **Important Note:** To use Firebase Storage for uploading high-res images, you must upgrade your Firebase project to the **Blaze (Pay-as-you-go) Plan**. However, you will *not* be charged until you exceed the 5GB storage or 50k daily read limits.
* **Expectation:** Extremely low cost or **free**.

### 4. OpenStreetMap / Leaflet (Nominatim)
* **Used for:** Fallback map rendering and geocoding if Google Maps fails or exceeds quota.
* **Cost:** **100% Free** and open-source.

---

## 🚀 Tech Stack

**Frontend**
* Framework: [Next.js](https://nextjs.org/) (App Router)
* Styling: [Tailwind CSS](https://tailwindcss.com/)
* Maps: `@react-google-maps/api` & `react-leaflet`
* Icons: [Lucide React](https://lucide.dev/)

**Backend & Database**
* AI Processing: [Google Generative AI (Gemini)](https://aistudio.google.com/)
* Auth: [Firebase Authentication](https://firebase.google.com/docs/auth)
* Database: [Cloud Firestore](https://firebase.google.com/docs/firestore)
* File Storage: [Firebase Storage](https://firebase.google.com/docs/storage)

**Utilities**
* PDF Generation: [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html)
* Image Handling: `react-easy-crop`

---

## 🛠 Getting Started

### 1. Prerequisites
* Node.js 18.x or later installed.
* A free [Firebase](https://console.firebase.google.com/) account (Blaze plan recommended for image storage).
* A free [Google AI Studio](https://aistudio.google.com/) account for the Gemini API Key.
* A free [Google Cloud Console](https://console.cloud.google.com/) account with Maps JavaScript API, Places API, and Geocoding API enabled.

### 2. Environment Variables
Create a `.env.local` file in the root of the project and add your configuration keys:

```env
# FIREBASE CONFIG
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# GOOGLE MAPS CONFIG
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# GEMINI AI CONFIG (Note: NOT prefixed with NEXT_PUBLIC_ for security)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Installation & Running

Clone the repository and install the dependencies:

```bash
git clone [https://github.com/your-username/church-directory.git](https://github.com/your-username/church-directory.git)
cd church-directory
npm install
```

Start the development server:

```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 👑 First Admin Setup

For security, anyone who signs up automatically receives a `pending` role. You must manually promote the first user to become an admin.

1. Sign up for an account on your local or live app.
2. Go to your Firebase Firestore console.
3. Open the `users` collection, find your user document, and change the `role` field from `"pending"` to `"admin"`.
4. Refresh your app. You now have full access to the Admin Dashboard!

---

## 📊 CSV Bulk Upload Format

To import existing members via the Admin Dashboard, your CSV file **must** contain exactly 12 columns in the following order. Save your spreadsheet as a Comma Separated Values (`.csv`) file. To group multiple people into the same family card, ensure they have the exact same `Mobile` (Primary Mobile) number.

| Col | Name | Description | Required? |
| :--- | :--- | :--- | :--- |
| 1 | `FamilyName` | The display name for the household | **Yes** |
| 2 | `Mobile` | **Primary Family Mobile**. Groups members together. | **Yes** |
| 3 | `CurrentAddress` | Residential address | No |
| 4 | `NativeAddress` | Hometown or native address | No |
| 5 | `HomeAssembly` | Current church branch/assembly | No |
| 6 | `CommendedAssembly`| Originating commended assembly | No |
| 7 | `Notes` | General household notes | No |
| 8 | `MemberName` | The individual's full name | **Yes** |
| 9 | `BloodGroup` | e.g., A+, O-, AB+ | No |
| 10| `WillingToDonate`| `TRUE` or `FALSE` | No |
| 11| `Tags` | Comma-separated (e.g., `youth, choir`) | No |
| 12| `MemberMobile` | The individual's personal mobile number | No |

---

## 🔒 Firebase Security Rules

Navigate to **Firestore Database** > **Rules** and apply:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isLoggedIn() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isAdmin() { return isLoggedIn() && getUserData().role == 'admin'; }
    function isApproved() { return isLoggedIn() && (getUserData().role == 'approved' || getUserData().role == 'admin'); }

    match /users/{userId} {
      allow read: if isLoggedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isLoggedIn() && request.auth.uid == userId && request.resource.data.role == 'pending';
      allow update, delete: if isAdmin();
    }
    match /members/{memberId} {
      allow read, create, update: if isApproved();
      allow delete: if isAdmin();
    }
    match /songs/{songId} {
      allow read: if isApproved();
      allow create, update, delete: if isAdmin();
    }
    match /notices/{noticeId} {
      allow read, create: if isApproved();
      allow update, delete: if isAdmin();
    }
    match /activity_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isLoggedIn();
      allow update, delete: if false;
    }
  }
}
```

### Storage Rules
Navigate to **Storage** > **Rules** and apply:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.contentType.matches('image/.*')
                   && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

---

## 🌍 Deployment & Custom Domains

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com). Ensure you add all your Environment Variables in the Vercel project settings.

**Security Note:** Be sure to restrict your Google Maps API key in the Google Cloud Console to only allow HTTP referrers from your specific Vercel domain and `http://localhost:3000`.

### Configuring CORS for PDF Exports (Custom Domains)
If you purchase a custom domain, you must tell Firebase Storage to allow your domain to download images for PDF generation.

1. Go to your Google Cloud Console dashboard.
2. Open the **Cloud Shell** (terminal icon in the top right).
3. Run the following command *(Update the URLs inside the brackets!)*:

```bash
echo '[{"origin": ["[https://your-actual-app.vercel.app](https://your-actual-app.vercel.app)", "http://localhost:3000", "[https://www.your-custom-domain.com](https://www.your-custom-domain.com)"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
```

4. Apply the policy to your specific Firebase Storage bucket:

```bash
gsutil cors set cors.json gs://your-project-id.firebasestorage.app
```

---

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and use it for your own congregation.