'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Upload, X, Crop as CropIcon } from 'lucide-react';
import { use } from 'react';
import Cropper from 'react-easy-crop';

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas');
  const MAX_WIDTH = 600;
  let scale = 1;
  if (pixelCrop.width > MAX_WIDTH) scale = MAX_WIDTH / pixelCrop.width;
  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
};

const autoCompressImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image')) return resolve(base64Str);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      let scale = 1;
      if (img.width > MAX_WIDTH) scale = MAX_WIDTH / img.width;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

export default function EditFamily({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading, userProfile } = useAuth(); // ADDED userProfile
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [familyName, setFamilyName] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [nativeAddress, setNativeAddress] = useState('');
  const [homeAssembly, setHomeAssembly] = useState('');
  const [commendedAssembly, setCommendedAssembly] = useState('');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState([{ name: '', bloodGroup: '', willingToDonate: false, tags: '' }]);

  const [photoUrl, setPhotoUrl] = useState('');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const isAdmin = user?.email?.toLowerCase().includes('admin');

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const docRef = doc(db, 'members', resolvedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFamilyName(data.familyName || '');
          setCurrentAddress(data.currentAddress || '');
          setNativeAddress(data.nativeAddress || '');
          setHomeAssembly(data.homeAssembly || '');
          setCommendedAssembly(data.commendedAssembly || '');
          setPrimaryMobile(data.primaryMobile || '');
          setStatus(data.status || 'Active');
          setPhotoUrl(data.photoUrl || '');
          setNotes(data.notes || '');

          if (data.members && data.members.length > 0) {
            setMembers(data.members.map((m: any) => ({
              ...m,
              tags: Array.isArray(m.tags) ? m.tags.join(', ') : (m.tags || ''),
              willingToDonate: m.willingToDonate || false
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching family:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchFamily();
  }, [resolvedParams.id, user]);

  const handleAddMember = () => setMembers([...members, { name: '', bloodGroup: '', willingToDonate: false, tags: '' }]);
  const handleMemberChange = (index: number, field: string, value: any) => {
    const newMembers = [...members] as any;
    newMembers[index][field] = value;
    setMembers(newMembers);
  };
  const removeMember = (index: number) => setMembers(members.filter((_, i) => i !== index));

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setRawImage(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    const croppedImageBase64 = await getCroppedImg(rawImage, croppedAreaPixels);
    setPhotoUrl(croppedImageBase64);
    setRawImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let safePhotoUrl = photoUrl;
    if (safePhotoUrl && safePhotoUrl.length > 300000) {
      safePhotoUrl = await autoCompressImage(safePhotoUrl);
    }

    const updatedData = {
      familyName, currentAddress, nativeAddress, homeAssembly, commendedAssembly,
      primaryMobile, photoUrl: safePhotoUrl, status, notes,
      members: members.filter(m => m.name.trim() !== '').map(m => ({
        ...m,
        tags: typeof m.tags === 'string' ? m.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []
      })),
      lastEdited: new Date().toISOString(),
    };

    try {
      if (isAdmin) {
        await updateDoc(doc(db, 'members', resolvedParams.id), updatedData);
        alert('Family updated successfully!');
      } else {
        await updateDoc(doc(db, 'members', resolvedParams.id), {
          hasPendingEdit: true,
          draftData: {
            ...updatedData,
            // UPDATED TO USE PROFILE NAME
            submittedBy: userProfile?.name || user?.displayName || user?.email || 'Unknown User'
          }
        });
        alert('Edit submitted! An admin will review your changes shortly.');
      }
      router.push('/directory');
    } catch (error) {
      console.error(error);
      alert('Failed to submit edit. Try removing the photo or uploading a smaller one.');
      setSaving(false);
    }
  };

  if (authLoading || loading || !user) return <div className="p-8 text-center text-slate-500">Loading editor...</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Edit Family</h1>
      {isAdmin ? (
        <p className="text-slate-500 mb-6 text-sm font-medium text-teal-600">Admin Mode: Changes will go live instantly.</p>
      ) : (
        <p className="text-slate-500 mb-6 text-sm">Your changes will be submitted to the church administration for approval.</p>
      )}

      {rawImage && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1">
            <Cropper image={rawImage} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="p-6 bg-slate-900 pb-12">
            <p className="text-white text-center text-sm mb-4">Pinch or scroll to zoom, drag to pan</p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setRawImage(null)} className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-bold">Cancel</button>
              <button type="button" onClick={saveCrop} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold flex justify-center items-center">
                <CropIcon size={18} className="mr-2" /> Save Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Family Photo</h2>
          {photoUrl && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-black">
              <img src={photoUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
              <button type="button" onClick={() => setPhotoUrl('')} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-lg shadow-md hover:bg-red-700 transition">
                <X size={18} />
              </button>
            </div>
          )}
          <label className={`flex items-center justify-center w-full p-4 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition ${photoUrl ? 'mt-4' : 'h-32 flex-col'}`}>
            {photoUrl ? (
              <div className="flex items-center text-teal-700 font-bold"><Upload className="w-5 h-5 mr-2" /> Change Photo</div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Click to upload new photo</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Primary Details</h2>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Family Name *</label>
            <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={familyName} onChange={e => setFamilyName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status / Association *</label>
            <select className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Primary Mobile *</label>
            <input required type="tel" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={primaryMobile} onChange={e => setPrimaryMobile(e.target.value)} />
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h2 className="font-bold text-slate-800">Family Members *</h2>
            <button type="button" onClick={handleAddMember} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 flex items-center">
              <Plus size={14} className="mr-1" /> Add Person
            </button>
          </div>
          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={index} className="flex gap-3 items-start relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

                <div className="flex-1 space-y-4">
                  {/* Name & Relation Row */}
                  <div className="flex gap-3">
                    <div className="w-2/3">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                      <input required placeholder="e.g. John Doe" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-600 font-bold" value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} />
                    </div>
                  </div>

                  {/* Explicit Tags Field */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags / Roles (Comma Separated)</label>
                    <input placeholder="e.g. Sunday School Student, 4th Std, Choir" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-600" value={member.tags || ''} onChange={e => handleMemberChange(index, 'tags', e.target.value)} />
                  </div>

                  {/* Blood Group & Donate */}
                  <div className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="w-1/3">
                      <select className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none bg-white font-medium" value={member.bloodGroup} onChange={e => handleMemberChange(index, 'bloodGroup', e.target.value)}>
                        <option value="">Blood...</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                      </select>
                    </div>
                    <label className="flex items-center text-sm text-slate-700 font-medium cursor-pointer w-2/3">
                      <input type="checkbox" className="w-4 h-4 mr-2.5 text-red-600 border-slate-300 rounded focus:ring-red-500" checked={member.willingToDonate} onChange={e => handleMemberChange(index, 'willingToDonate', e.target.checked)} />
                      Willing to donate
                    </label>
                  </div>
                </div>

                {/* Remove button */}
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5"><Trash2 size={18} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Contact & Additional Info</h2>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Current Address *</label>
            <textarea required rows={3} className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Native Address</label>
            <textarea rows={2} className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={nativeAddress} onChange={e => setNativeAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Home Assembly</label>
              <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={homeAssembly} onChange={e => setHomeAssembly(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Commended Assembly</label>
              <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={commendedAssembly} onChange={e => setCommendedAssembly(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Additional Information</label>
            <textarea rows={2} className="w-full p-3 border border-slate-300 rounded-lg outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="pt-4 pb-20 flex gap-4">
          <button type="button" onClick={() => router.push('/directory')} className="w-1/3 bg-slate-200 text-slate-800 font-bold p-4 rounded-xl hover:bg-slate-300 transition">Cancel</button>
          <button type="submit" disabled={saving} className="w-2/3 bg-teal-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-teal-800 transition disabled:opacity-50">
            {saving ? 'Submitting...' : (isAdmin ? 'Update Live Details' : 'Submit for Approval')}
          </button>
        </div>
      </form>
    </div>
  );
}