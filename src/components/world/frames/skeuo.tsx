import '../../../styles/families/skeuo.css';
import '../../../styles/families/skeuo-era.css';
import { useEra } from '../../../theme/EraThemeProvider';
import { MobileHeader } from '../headers/skeuo';
import { MobileHome } from '../families/homes-skeuo';
import { ComposedHome, StandardFrame, type FrameProps } from '../shared';

export default function SkeuoFrame(props: FrameProps) {
  const era = useEra();
  return <StandardFrame {...props} Header={MobileHeader} Home={era.exp.composition ? ComposedHome : MobileHome} />;
}
