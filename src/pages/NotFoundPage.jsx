import { computed, defineComponent } from 'vue';
import { RouterLink as Link } from 'vue-router';
import {
  AppearanceMenu,
  FontSizeControl,
  PageShell,
  useFontScale,
} from '@phenomcanvas/ui-vue';
import { CANVAS_HOME, CANVAS_INDEX } from '../config.js';

export default defineComponent({
  name: 'NotFoundPage',
  setup() {
    const { scale, setScale } = useFontScale();
    return () => {
      return (
        <div id="main-content">
          <PageShell
            title="查無此頁。"
            eyebrow="404"
            fontScale={scale.value}
            manageDocumentTitle={false}
            back={CANVAS_HOME}
            backIndexHref={CANVAS_INDEX}
            controls={(
              <>
                <FontSizeControl scale={scale.value} onChange={setScale} />
                <AppearanceMenu />
              </>
            )}
          >
            <Link to="/" class="text-token-sm text-accent underline decoration-line underline-offset-4">
              回手記
            </Link>
          </PageShell>
        </div>
      );
    };
  },
});
