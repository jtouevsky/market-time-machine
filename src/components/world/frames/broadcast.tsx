import '../../../styles/families/print.css';
import '../../../styles/families/broadcast.css';
import '../../../styles/families/mid-century.css';
import '../../../styles/families/teletext.css';
import { useEra } from '../../../theme/EraThemeProvider';
import { BroadcastHeader, TeletextHeader } from '../headers/broadcast';
import { BroadcastHome } from '../families/homes-broadcast';
import { ComposedHome, StandardFrame, type FrameProps } from '../shared';

export default function BroadcastFrame(props: FrameProps) {
  const era = useEra();
  return <StandardFrame {...props} Header={era.exp.archetype === 'teletext' ? TeletextHeader : BroadcastHeader} Home={era.exp.composition ? ComposedHome : BroadcastHome} />;
}
