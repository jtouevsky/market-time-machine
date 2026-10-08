import '../../../styles/families/modern.css';
import '../../../styles/families/palette.css';
import '../../../styles/families/dash.css';
import '../../../styles/families/modern-era.css';
import { FinHeader } from '../headers/modern';
import { Dashboard } from '../families/dash';
import { StandardFrame, type FrameProps } from '../shared';

export default function ModernFrame(props: FrameProps) {
  return <StandardFrame {...props} Header={FinHeader} Home={Dashboard} />;
}
