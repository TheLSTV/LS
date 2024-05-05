package com.lstv.nativebridge;

import android.annotation.SuppressLint;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class LSBridge {
    private WebView webView;
    private final DynamicColorBridge dynamicColorBridge;

    public LSBridge(Context activity) {
        this.dynamicColorBridge = new DynamicColorBridge(activity);
    }

    @SuppressLint("SetJavaScriptEnabled")
    public void attach(WebView webView){
        this.webView = webView;

        webView.setWebViewClient(new WebViewClient());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
    }

    public void load(String file){
        webView.loadUrl("file:///android_asset/" + file);
        webView.addJavascriptInterface(this, "LSNative_Android_Proxy");
    }

    @JavascriptInterface
    public String handle(String event) {
        switch (event) {
            case "ping":
                return "pong";
            case "dynamicColors.isAvailable":
                return this.dynamicColorBridge.isDynamicColorAvailable()? "true" : "false";
            case "dynamicColors.isLight":
                return this.dynamicColorBridge.dayNightIsDay()? "true" : "false";
            case "dynamicColors.getColor":
                return this.dynamicColorBridge.getDynamicColor();
            case "dynamicColors.getPalette":
                return this.dynamicColorBridge.getDynamicPalette();
            case "dynamicColors.getMain":
                return this.dynamicColorBridge.getDynamicMainColor();
            default:
                return null;
        }
    }
}