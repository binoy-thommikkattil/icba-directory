'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Upload, X, Crop as CropIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/lib/AuthContext';
import LocationPicker from '@/components/LocationPicker';

const MEMBER_TAG_OPTIONS = ['Bachelor Meeting', 'Youth Meeting', 'Brothers Meeting', 'Sisters Meeting', 'Sunday School', 'Choir'];

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  const canvas = document.createElement('canvas');
  const TARGET_WIDTH = 800;
  const TARGET_HEIGHT = 600;
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Unable to create canvas context');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_WIDTH,
    TARGET_HEIGHT
  );

  return canvas.toDataURL('image/jpeg', 0.9);
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

function EditFamilyContent() {
  const { user, role, userProfile } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const params = useParams();
  const familyId = (params?.id as string) || searchParams.get('id');

  const isAdmin = userProfile?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ADDRESS & NEW MAP STATES (Separated Lat & Lng)
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentMapAddress, setCurrentMapAddress] = useState('');
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  
  const [nativeAddress, setNativeAddress] = useState('');
  const [nativeMapAddress, setNativeMapAddress] = useState('');
  const [nativeLat, setNativeLat] = useState<number | null>(null);
  const [nativeLng, setNativeLng] = useState<number | null>(null);

  const [homeAssembly, setHomeAssembly] = useState('');
  const [commendedAssembly, setCommendedAssembly] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  const [photoUrl, setPhotoUrl] = useState('');
  const [existingBase64, setExistingBase64] = useState('');

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    async function fetchFamily() {
      if (!familyId) {
        console.error("No family ID found in URL.");
        setFetching(false);
        return;
      }
      try {
        const docRef = doc(db, 'members', familyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // LOAD ADDRESS & SEPARATED MAP DATA (Includes fallback for old schema entries)
          setCurrentAddress(data.currentAddress || '');
          setCurrentMapAddress(data.currentMapAddress || '');
          setCurrentLat(data.currentLat || data.currentCoordinates?.lat || null);
          setCurrentLng(data.currentLng || data.currentCoordinates?.lng || null);

          setNativeAddress(data.nativeAddress || '');
          setNativeMapAddress(data.nativeMapAddress || '');
          setNativeLat(data.nativeLat || data.nativeCoordinates?.lat || null);
          setNativeLng(data.nativeLng || data.nativeCoordinates?.lng || null);
          
          setHomeAssembly(data.homeAssembly || '');
          setCommendedAssembly(data.commendedAssembly || '');
          setStatus(data.status || 'Active');
          setNotes(data.notes || '');

          setPhotoUrl(data.photoUrl || data.photoBase64 || '');
          setExistingBase64(data.photoBase64 || '');

          let fetchedMembers = data.members || [];

          if (fetchedMembers.length > 0) {
            if (!fetchedMembers[0].name) fetchedMembers[0].name = data.familyName || '';
            if (!fetchedMembers[0].mobile) fetchedMembers[0].mobile = data.primaryMobile || '';

            fetchedMembers = fetchedMembers.map((m: any) => ({
              ...m,
              name: m.name || '',
              mobile: m.mobile || '',
              bloodGroup: m.bloodGroup || '',
              willingToDonate: !!m.willingToDonate,
              tags: Array.isArray(m.tags) ? m.tags : []
            }));
          } else {
            fetchedMembers = [{ name: data.familyName || '', mobile: data.primaryMobile || '', bloodGroup: '', willingToDonate: false, tags: [] as string[] }];
          }

          setMembers(fetchedMembers);
        } else {
          console.error("Family document does not exist!");
        }
      } catch (error) {
        console.error("Error fetching family:", error);
      } finally {
        setFetching(false);
      }
    }
    fetchFamily();
  }, [familyId]);

  const handleAddMember = () => setMembers([...members, { name: '', mobile: '', bloodGroup: '', willingToDonate: false, tags: [] as string[] }]);
  const handleMemberChange = (index: number, field: string, value: any) => {
    const newMembers = [...members];
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
    if (!familyId) return;
    setLoading(true);

    const primaryMember = members[0];
    if (!primaryMember.name || !primaryMember.mobile) {
      alert("The Primary Member must have a full name and mobile number.");
      setLoading(false);
      return;
    }

    if (!currentAddress.trim() && !currentLat) {
      alert("Please provide a Current Address or set a Location Pin.");
      setLoading(false);
      return;
    }

    // --- BULLETPROOF DUAL-SAVE SYSTEM ---
    let finalStorageUrl = photoUrl;
    let finalBase64Backup = existingBase64;

    if (photoUrl && photoUrl.startsWith('data:image')) {
      finalBase64Backup = photoUrl.length > 300000 ? await autoCompressImage(photoUrl) : photoUrl;

      try {
        const fileName = `family_photos/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadString(storageRef, photoUrl, 'data_url');
        finalStorageUrl = await getDownloadURL(storageRef);
      } catch (uploadError) {
        console.warn("Firebase Storage failed. Relying entirely on Base64 backup.", uploadError);
        finalStorageUrl = ''; 
      }
    } else if (!photoUrl) {
      finalStorageUrl = '';
      finalBase64Backup = '';
    }

    const formData = {
      familyName: primaryMember.name,
      primaryMobile: primaryMember.mobile,
      
      // SAVED AS SEPARATE DB FIELDS
      currentAddress,
      currentMapAddress,
      currentLat,
      currentLng,
      
      nativeAddress,
      nativeMapAddress,
      nativeLat,
      nativeLng,
      
      homeAssembly,
      commendedAssembly,

      photoUrl: finalStorageUrl,
      photoBase64: finalBase64Backup,

      status,
      notes,
      members: members.filter(m => m.name.trim() !== '').map(m => ({
        ...m,
        tags: Array.isArray(m.tags) ? m.tags : []
      })),
      lastEdited: new Date().toISOString(),
      submittedBy: userProfile?.name || user?.displayName || user?.email || 'Unknown User'
    };

    try {
      if (isAdmin) {
        await updateDoc(doc(db, 'members', familyId), {
          ...formData,
          hasPendingEdit: false,
          draftData: null
        });
        alert('Family details updated successfully!');
      } else {
        await updateDoc(doc(db, 'members', familyId), {
          hasPendingEdit: true,
          draftData: formData
        });
        alert('Edit submitted for admin approval!');
      }
      router.push('/directory');
    } catch (error) {
      console.error(error);
      alert('Failed to update details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600 mr-2" size={24} /> Loading details...
      </div>
    );
  }

  if (!familyId) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Error: Family ID Missing</h2>
        <p className="text-slate-500 mb-6">We couldn't find the family you are trying to edit.</p>
        <Link href="/directory" className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-bold">Return to Directory</Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen relative z-10">
      <Link href="/directory" className="mb-6 inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} className="mr-1" /> Back to Directory
      </Link>

      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-6">Edit Family Details</h1>

      {rawImage && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1 flex items-center justify-center p-6">
            <div className="relative w-full max-w-3xl aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="horizontal-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full border-2 border-white/90 rounded-3xl" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-900 pb-12">
            <p className="text-white text-center text-sm mb-4">Drag to position the photo, then use the slider to zoom.</p>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-slate-200 min-w-[5rem]">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
            </div>
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

        {isAdmin && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="block text-sm font-bold text-slate-700 mb-1">Status / Association *</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-lg outline-none bg-white font-medium"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Family Photo</h2>
          {photoUrl && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-black">
              <img src={photoUrl} className="w-full h-full aspect-[4/3] object-cover object-center opacity-80" alt="Preview" />
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
                <p className="text-sm text-slate-500 font-medium">Click to upload photo</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h2 className="font-bold text-slate-800">Members *</h2>
            <button type="button" onClick={handleAddMember} className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 flex items-center">
              <Plus size={14} className="mr-1" /> Add Person
            </button>
          </div>
          <div className="space-y-4 pt-2">
            {members.map((member, index) => (
              <div key={index} className={`flex gap-3 items-start relative bg-white p-4 rounded-xl border shadow-sm ${index === 0 ? 'border-teal-300 pt-6' : 'border-slate-200'}`}>

                {index === 0 && (
                  <span className="absolute -top-3 left-4 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    Primary Member
                  </span>
                )}

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                      <input required placeholder="e.g. John Mark" className={`w-full p-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:border-teal-600 font-bold ${index === 0 ? 'border-teal-200' : 'border-slate-200'}`} value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${index === 0 ? 'text-teal-700' : 'text-slate-500'}`}>
                        {index === 0 ? 'Primary Mobile *' : 'Personal Mobile'}
                      </label>
                      <input
                        required={index === 0}
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className={`w-full p-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:border-teal-600 ${index === 0 ? 'border-teal-200 font-bold' : 'border-slate-200'}`}
                        value={member.mobile || ''}
                        onChange={e => handleMemberChange(index, 'mobile', e.target.value)}
                      />
                    </div>
                    {index > 0 && (
                      <button type="button" onClick={() => removeMember(index)} className="shrink-0 self-center p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags / Roles</label>
                    <select
                      multiple
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-600 min-h-[7rem]"
                      value={Array.isArray(member.tags) ? member.tags : []}
                      onChange={e => {
                        const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
                        handleMemberChange(index, 'tags', selectedTags);
                      }}
                    >
                      {MEMBER_TAG_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="w-1/3">
                      <select className="w-full p-2 border border-slate-200 rounded-md text-sm outline-none bg-white font-medium" value={member.bloodGroup} onChange={e => handleMemberChange(index, 'bloodGroup', e.target.value)}>
                        <option value="">Blood Group</option>
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

              </div>
            ))}
            <button type="button" onClick={handleAddMember} className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-600 bg-white px-4 py-3 text-sm font-semibold text-teal-600 transition hover:bg-teal-50">
              <Plus size={16} className="shrink-0" />
              <span>Add Another Person</span>
            </button>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Contact & Location</h2>
          
          <LocationPicker
            label="Current Address & Location *"
            type="Current"
            isAdmin={isAdmin}
            address={currentAddress}
            mapAddress={currentMapAddress}
            lat={currentLat}
            lng={currentLng}
            onChange={(data) => {
              setCurrentAddress(data.address);
              setCurrentMapAddress(data.mapAddress);
              setCurrentLat(data.lat);
              setCurrentLng(data.lng);
            }}
          />

          <LocationPicker
            label="Native Address & Location"
            type="Native"
            isAdmin={isAdmin}
            address={nativeAddress}
            mapAddress={nativeMapAddress}
            lat={nativeLat}
            lng={nativeLng}
            onChange={(data) => {
              setNativeAddress(data.address);
              setNativeMapAddress(data.mapAddress);
              setNativeLat(data.lat);
              setNativeLng(data.lng);
            }}
          />

          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Home Assembly</label>
              <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={homeAssembly} onChange={e => setHomeAssembly(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Commended Assembly</label>
              <input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={commendedAssembly} onChange={e => setCommendedAssembly(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Additional Information</label>
            <textarea rows={2} className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-teal-700 text-white font-bold p-4 rounded-xl shadow-md hover:bg-teal-800 transition disabled:opacity-50">
          {loading ? 'Processing...' : (isAdmin ? 'Save Changes' : 'Submit Edit for Approval')}
        </button>
      </form>
    </div>
  );
}

// Next.js Suspense wrapper required for useSearchParams()
export default function EditFamily() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center font-bold text-slate-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>}>
      <EditFamilyContent />
    </Suspense>
  );
}