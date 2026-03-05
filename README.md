# ⛪ Church Directory Application

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern, secure, and fully-featured web application built with **Next.js** and **Firebase**. Designed specifically for churches, assemblies, and congregations to seamlessly manage their member directory, emergency blood registry, and community communications.

---

## 🌟 Key Features

* **Smart Directory:** Searchable family and individual member directory with deduplication, fast loading, and secure data access.
* **Role-Based Access Control (RBAC):** * 👑 **Admins:** Can bulk upload via CSV, bypass approval queues, manage users, edit any family, and view the system audit log.
  * 👤 **Approved Members:** Can view the directory, export PDFs, post to noticeboards, and submit their own family details for admin approval.
  * ⏳ **Pending Users:** Restricted to a secure "Waiting Room" until an admin explicitly approves their account.
* **Smart Sub-Groups:** Auto-populating directories and dedicated Noticeboards for specific groups (e.g., Youth, Sunday School, Choir) based on custom member tags.
* **Emergency Blood Registry:** Quickly find willing blood donors within the congregation, complete with 1-click WhatsApp and phone call routing directly to the individual's personal mobile.
* **Professional PDF Generation:** Generate formatted PDF directory books or single family cards with automatic pagination, timestamps, and generator watermarks.
* **Robust CSV Bulk Upload:** Admins can securely import hundreds of families at once using a CSV parser that intelligently groups individual members into households based on primary mobile numbers.
* **Image Cropping & Hybrid Storage:** Built-in UI for members to perfectly crop family profile pictures before saving. Includes a dual-save system that uploads high-res photos to Firebase Storage while creating low-res Base64 backups in the database.
* **Tamper-Proof Audit Logging:** Tracks exactly who creates, edits, or deletes data (notices, family records, PDF exports) with exact timestamps.

---

## 🚀 Tech Stack

**Frontend**
* Framework: [Next.js](https://nextjs.org/) (App Router)
* Styling: [Tailwind CSS](https://tailwindcss.com/)
* Icons: [Lucide React](https://lucide.dev/)

**Backend & Database**
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
* A free [Firebase](https://console.firebase.google.com/) account. *(Note: To use Firebase Storage for high-res images, your project must be on the pay-as-you-go Blaze plan, though it includes a generous free tier).*

### 2. Firebase Setup
1. Create a new Firebase project in the console.
2. Enable **Authentication** (Email/Password provider).
3. Enable **Firestore Database** (Start in production mode).
4. Enable **Firebase Storage** (For family profile photos).
5. Go to **Project Settings** > **General** and register a new Web App to get your config keys.

### 3. Installation

Clone the repository and install the dependencies:

```bash
git clone [https://github.com/your-username/church-directory.git](https://github.com/your-username/church-directory.git)
cd church-directory
npm install
```

### 4. Environment Variables
Create a `.env.local` file in the root of the project and add your Firebase configuration keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Run the Application
Start the development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👑 First Admin Setup

For security, anyone who signs up automatically receives a `pending` role. You must manually promote the first user to become an admin.

1. Sign up for an account on your local or live app.
2. Go to your Firebase Firestore console.
3. Open the `users` collection, find your user document, and change the `role` field from `"pending"` to `"admin"`.
4. Refresh your app. You now have full access to the Admin Dashboard!

---

## 📊 CSV Bulk Upload Format

To import existing members via the Admin Dashboard, your CSV file **must** contain exactly 12 columns in the following order. 

> ⚠️ **Important:** Do not use `.xlsx` files; save your spreadsheet as a Comma Separated Values (`.csv`) file. To group multiple people into the same family card, ensure they have the exact same `Mobile` (Primary Mobile) number.

| Col | Name | Description | Required? |
| :--- | :--- | :--- | :--- |
| 1 | `FamilyName` | The display name for the household (e.g., "The Doe Family") | **Yes** |
| 2 | `Mobile` | **Primary Family Mobile**. Used to group members together. | **Yes** |
| 3 | `CurrentAddress` | Residential address | No |
| 4 | `NativeAddress` | Hometown or native address | No |
| 5 | `HomeAssembly` | Current church branch/assembly | No |
| 6 | `CommendedAssembly`| Originating commended assembly | No |
| 7 | `Notes` | General household notes | No |
| 8 | `MemberName` | The individual's full name | **Yes** |
| 9 | `BloodGroup` | e.g., A+, O-, AB+ | No |
| 10| `WillingToDonate`| `TRUE` or `FALSE` | No |
| 11| `Tags` | Comma-separated (e.g., `youth, choir, committee`) | No |
| 12| `MemberMobile` | The individual's personal mobile number | No |

---

## 🔒 Firebase Security Rules

Before deploying to production, ensure you lock down your database and storage buckets to prevent unauthorized access.

### Firestore Rules
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
    match /family_photos/{imageId} {
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

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com). Don't forget to add your Firebase Environment Variables in the Vercel project settings!

### Configuring CORS for PDF Exports (Custom Domains)
If you purchase a custom domain, you must tell Firebase Storage to allow your domain to download images for PDF generation. Otherwise, the browser will block the images from exporting.

1. Go to your Google Cloud Console dashboard:  
   `https://console.cloud.google.com/home/dashboard?project=project-a56a9984-d9df-4577-909&cloudshell=true`
2. Open the **Cloud Shell** (terminal icon in the top right).
3. Run the following command to create a CORS policy file. *(Update the URLs inside the brackets with your actual Vercel and custom domain links!)*

```bash
echo '[{"origin": ["[https://your-actual-app.vercel.app](https://your-actual-app.vercel.app)", "http://localhost:3000", "[https://www.your-custom-domain.com](https://www.your-custom-domain.com)"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json
```

4. Apply the policy to your specific Firebase Storage bucket:

```bash
gsutil cors set cors.json gs://icba-directory.firebasestorage.app
```

---

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and use it for your own congregation.