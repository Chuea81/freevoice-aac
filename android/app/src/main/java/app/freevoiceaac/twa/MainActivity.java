package app.freevoiceaac.twa;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge layout so content extends to system UI edges
        // Window insets will be handled via CSS safe-area properties
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Set fullscreen flag to prevent floating app overlays from blocking content
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);

        // Fix audio playback in WebView for TTS and Web Audio API
        WebView webView = getBridge().getWebView();
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setJavaScriptEnabled(true);

        // Enable Web Speech API (required for device voice synthesis)
        // Some Android versions block this by default
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);

        // Enable SharedArrayBuffer for Kokoro TTS (requires COOP/COEP headers)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = super.shouldInterceptRequest(view, request);
                if (response != null) {
                    response.getResponseHeaders().put("Cross-Origin-Opener-Policy", "same-origin");
                    response.getResponseHeaders().put("Cross-Origin-Embedder-Policy", "require-corp");
                }
                return response;
            }
        });
    }
}
