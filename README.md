# Church Directory & Community Portal

A modern, secure, and fully-featured web application built with **Next.js** and **Firebase**, designed specifically for churches, assemblies, and congregations to manage their member directory, emergency blood registry, and community communications.

## 🌟 Key Features

* **Smart Directory:** Searchable family and individual member directory with deduplication and secure data access.
* **Role-Based Access Control (RBAC):** * **Admins:** Can bulk upload via CSV, bypass approval queues, manage users, edit any family, and view the system audit log.
  * **Approved Members:** Can view the directory, export PDFs, post to noticeboards, and submit their own family details for admin approval.
  * **Pending Users:** Restricted to a "Waiting Room" until an admin approves their account.
* **Community Sub-Groups:** Auto-populating directories and dedicated Noticeboards for specific groups (e.g., Youth, Sunday School, Bachelors/Spinsters) based on member tags.
* **Emergency Blood Registry:** Quickly find willing blood donors within the congregation, complete with 1-click WhatsApp and phone call routing to the individual's personal mobile.
* **Professional PDF Generation:** Generate formatted PDF directory books or single family cards with automatic pagination, timestamps, and generator watermarks.
* **Robust CSV Bulk Upload:** Admins can securely import hundreds of families at once using a robust CSV parser that intelligently groups family members by primary mobile numbers.
* **Image Cropping:** Built-in UI for members to upload and crop family profile pictures perfectly before saving.
* **Audit Logging:** Tracks who creates, edits, or deletes data (notices, family records, PDF exports) with exact timestamps.

---

## 🚀 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Firebase Authentication, Firebase Storage)
* **PDF Generation:** [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html)
* **Image Handling:** `react-easy-crop`

---

## 🛠 Getting Started

### 1. Prerequisites
* Node.js 18.x or later installed.
* A free [Firebase](https://console.firebase.google.com/) account.

### 2. Firebase Setup
1. Create a new Firebase project.
2. Enable **Authentication** (Email/Password).
3. Enable **Firestore Database** (Start in production mode).
4. Enable **Firebase Storage** (For family profile photos).
5. Go to Project Settings and register a new Web App to get your config keys.

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
Because the app requires an admin to approve users, you must manually make the first user an admin.
1. Sign up for an account on your local app.
2. Go to your Firebase Firestore console.
3. Open the `users` collection, find your user document, and change the `role` field from `"pending"` to `"admin"`.
4. Refresh the app. You now have access to the Admin Dashboard!

---

## 📊 CSV Bulk Upload Format

To import existing members via the Admin Dashboard, your CSV file **must** contain exactly 12 columns in the following order. **Do not use `.xlsx` files; save your spreadsheet as a Comma Separated Values (.csv) file.**

To group multiple people into the same family card, ensure they have the exact same `Mobile` (Primary Mobile) number.

| Column | Name | Description | Required? |
| :--- | :--- | :--- | :--- |
| 1 | `FamilyName` | The display name for the household (e.g., "The Doe Family") | Yes |
| 2 | `Mobile` | **Primary Family Mobile**. Used to group family members together. | **Yes** |
| 3 | `CurrentAddress` | Residential address | No |
| 4 | `NativeAddress` | Hometown or native address | No |
| 5 | `HomeAssembly` | Current church branch/assembly | No |
| 6 | `CommendedAssembly`| Originating commended assembly | No |
| 7 | `Notes` | General household notes | No |
| 8 | `MemberName` | The individual's full name | Yes |
| 9 | `BloodGroup` | e.g., A+, O-, AB+ | No |
| 10| `WillingToDonate`| `TRUE` or `FALSE` | No |
| 11| `Tags` | Comma-separated (e.g., `youth`, `sunday school`, `bachelor`) | No |
| 12| `MemberMobile` | The individual's personal mobile number | No |

---

## 🔒 Firestore Security Rules

*(Important: Before deploying to production, ensure you set up proper Firestore Security Rules to prevent unauthorized read/write access to your `members`, `users`, `notices`, and `activity_logs` collections.)*

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). 
Don't forget to add your Firebase Environment Variables in the Vercel project settings!

## 📄 License
This project is open-source and available under the MIT License. Feel free to fork, modify, and use it for your own congregation.