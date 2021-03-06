import candela from 'candela';
import 'candela/plugins/sententree/load';

import { goal } from '../datasets';
import showComponent from '../util/showComponent';

window.onload = () => {
  showComponent(candela.components.SentenTree, {
    data: goal,
    id: 'id',
    text: 'text',
    count: 'count',
    graphs: 3
  });
};
