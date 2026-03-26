package com.medicare.emr;  // ✅ keep your existing package name

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Keep screen on while doctor is writing prescriptions
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onStart() {
        super.onStart();

        // ✅ Grant mic access to WebView — this is what makes Maya work
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Auto-grant mic + camera permissions to WebView
                request.grant(request.getResources());
            }
        });
    }
}
```

---

## What about `mainactivity.xml`?

That's just the **layout file** — you don't need to touch it at all. It only controls the visual container, not the logic. Leave it exactly as is. ✅

---

## Your file locations should be:
```
android/
  app/
    src/
      main/
        java/
          com/medicare/emr/
            MainActivity.java   ← update this
        res/
          layout/
            mainactivity.xml    ← leave this alone
        AndroidManifest.xml     ← already updated