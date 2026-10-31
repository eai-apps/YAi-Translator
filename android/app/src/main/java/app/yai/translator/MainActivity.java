package app.yai.translator;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

import org.json.JSONObject;

/**
 * Главная activity. Принимает текст из меню выделения (PROCESS_TEXT) и «Поделиться» (SEND)
 * и передаёт его в веб-часть: window.__YAI_PENDING_SHARED_TEXT__ + событие «yaiSharedText»
 * (их читает src/components/app/AppPlatformBridge.tsx).
 */
public class MainActivity extends BridgeActivity {
    private String pendingText;
    private boolean pageLoaded = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        pendingText = readSharedText(getIntent());
        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                pageLoaded = true;
                deliverPending();
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String text = readSharedText(intent);
        if (text != null) {
            pendingText = text;
            if (pageLoaded) deliverPending();
        }
    }

    private String readSharedText(Intent intent) {
        if (intent == null || intent.getAction() == null) return null;
        CharSequence value = null;
        if (Intent.ACTION_PROCESS_TEXT.equals(intent.getAction())) {
            value = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT);
        } else if (Intent.ACTION_SEND.equals(intent.getAction())) {
            value = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        }
        if (value == null) return null;
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private void deliverPending() {
        if (pendingText == null || bridge == null || bridge.getWebView() == null) return;
        final String json = JSONObject.quote(pendingText);
        pendingText = null;
        final String js = "window.__YAI_PENDING_SHARED_TEXT__=" + json + ";"
                + "window.dispatchEvent(new CustomEvent('yaiSharedText',{detail:{text:" + json + "}}));";
        final WebView webView = bridge.getWebView();
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
