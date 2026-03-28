import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function openOrSharePDF(pdfUrl: string, filename: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      // ✅ APK — download then share
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      // Save to device
      const savedFile = await Filesystem.writeFile({
        path: `${filename}.pdf`,
        data: base64,
        directory: Directory.Cache,
      });

      // Share/open with native apps
      await Share.share({
        title: filename,
        url: savedFile.uri,
        dialogTitle: 'Open PDF with',
      });

    } else {
      // ✅ Browser — open in new tab
      window.open(pdfUrl, '_blank');
    }
  } catch (error) {
    console.error('PDF error:', error);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// For print — open in browser
export async function printPrescription(htmlContent: string) {
  if (Capacitor.isNativePlatform()) {
    // Save HTML and open in browser
    await Browser.open({
      url: `data:text/html,${encodeURIComponent(htmlContent)}`,
    });
  } else {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(htmlContent);
      w.document.close();
      w.print();
    }
  }
}