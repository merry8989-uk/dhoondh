package ai.dhoondh.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Minimal WebView wrapper around the Dhoondh search engine.
 * Loads the hosted PWA; links to other sites open in the device browser.
 */
public class MainActivity extends Activity {

    private static final String HOME = "https://merry8989-uk.github.io/dhoondh/";
    private static final String HOST = "merry8989-uk.github.io";

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // needed for the language preference
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (u.getHost() != null && u.getHost().endsWith(HOST)) {
                    return false;              // keep our own pages in-app
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));  // everything else in the browser
                } catch (Exception ignored) { }
                return true;
            }
        });

        web.loadUrl(HOME);
        setContentView(web);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
