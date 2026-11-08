package app.lexistencehub;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android scales every text in the web view by the phone's font-size setting
        // (often large on Xiaomi), but the app's circles, cards and grids keep their
        // size, so words broke in the middle ("GENERA / L"). Text follows the layout
        // instead; the phone's display-size setting still scales everything together.
        getBridge().getWebView().getSettings().setTextZoom(100);
    }
}
