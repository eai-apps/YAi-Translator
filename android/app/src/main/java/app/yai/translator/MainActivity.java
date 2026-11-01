package app.yai.translator;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

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
        applySystemBarInsets();
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

    /**
     * Android 15+ рисует приложение под статус-баром и кнопками навигации («◀ ● ■»).
     * Отодвигаем весь экран от системных панелей и выреза — кнопки приложения больше не попадают под них.
     * Клавиатуру тоже учитываем здесь: экран сжимается над ней (Keyboard.resize = 'none',
     * SystemBars.insetsHandling = 'disable' в capacitor.config.ts — чтобы не было двойных отступов).
     */
    private void applySystemBarInsets() {
        View content = findViewById(android.R.id.content);
        content.setBackgroundColor(0xFF0E1117);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets bars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });
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
