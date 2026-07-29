import { Link } from 'react-router-dom';
import {
  AppearanceMenu,
  FontSizeControl,
  PageShell,
  useFontScale,
} from '@phenomcanvas/ui';
import { CANVAS_HOME, CANVAS_INDEX } from '../config.js';

export default function NotFoundPage() {
  const [scale, setScale] = useFontScale();
  return (
    <div id="main-content">
      <PageShell
        title="查無此頁。"
        eyebrow="404"
        fontScale={scale}
        manageDocumentTitle={false}
        back={CANVAS_HOME}
        backIndexHref={CANVAS_INDEX}
        controls={(
          <>
            <FontSizeControl scale={scale} onChange={setScale} />
            <AppearanceMenu />
          </>
        )}
      >
        <Link to="/" className="text-token-sm text-accent underline decoration-line underline-offset-4">
          回手記
        </Link>
      </PageShell>
    </div>
  );
}
