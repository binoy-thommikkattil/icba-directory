// lib/imageUtils.ts

export const getBase64ImageFromUrl = async (
  imageUrl: string
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  try {
    // 1. Fetch the raw image securely via CORS
    const response = await fetch(imageUrl, { mode: 'cors' });
    
    if (!response.ok) {
      const errorMsg = `Firebase Storage HTTP Error: ${response.status} ${response.statusText}`;
      console.error(errorMsg);
      alert(`PDF Image Fetch Failed:\n${errorMsg}\n\nUrl: ${imageUrl}`);
      return null;
    }
    
    // 2. Download as a Blob (raw file data)
    const blob = await response.blob();

    // 3. Convert Blob to safe Base64 text
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const img = new window.Image();
        
        img.onload = () => {
          resolve({ dataUrl, width: img.width, height: img.height });
        };
        
        img.onerror = () => {
          const errorMsg = "Browser failed to read image dimensions from converted text.";
          console.error(errorMsg);
          alert(errorMsg);
          resolve(null);
        };
        
        img.src = dataUrl;
      };
      
      reader.onerror = () => {
        const errorMsg = "FileReader failed to convert raw bytes to base64 text.";
        console.error(errorMsg);
        alert(errorMsg);
        resolve(null);
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    const errorMsg = `Network/CORS Exception during fetch:\n${error?.message || error}`;
    console.error(errorMsg);
    alert(errorMsg);
    return null;
  }
};