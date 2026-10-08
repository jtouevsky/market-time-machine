import '../../../styles/families/flat.css';
import '../../../styles/families/palette.css';
import '../../../styles/families/dash.css';
import '../../../styles/families/flat-era.css';
import { FlatHeader } from '../headers/flat';
import { Dashboard } from '../families/dash';
import { StandardFrame, type FrameProps } from '../shared';

export default function FlatFrame(props: FrameProps) {
  return <StandardFrame {...props} Header={FlatHeader} Home={Dashboard} />;
}
