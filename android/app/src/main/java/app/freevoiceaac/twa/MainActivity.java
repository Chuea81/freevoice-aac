package app.freevoiceaac.twa;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fix audio playback in WebView for TTS and Web Audio API
        WebView webView = getBridge().getWebView();
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.getSettings().setJavaScriptEnabled(true);

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
