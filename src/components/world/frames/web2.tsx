import '../../../styles/families/web2.css';
import '../../../styles/families/web2-era.css';
import { useEra } from '../../../theme/EraThemeProvider';
import { Web2Footer, Web2Header } from '../headers/web2';
import { Web2Home } from '../families/homes-web2';
import { ComposedHome, StandardFrame, type FrameProps } from '../shared';

export default function Web2Frame(props: FrameProps) {
  const era = useEra();
  return <StandardFrame {...props} Header={Web2Header} Footer={Web2Footer} Home={era.exp.composition ? ComposedHome : Web2Home} />;
}
