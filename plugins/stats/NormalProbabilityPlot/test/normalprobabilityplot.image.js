import imageTest from '../../../../test/util/imageTest';

imageTest({
  name: 'normalprobabilityplot',
  url: 'http://localhost:28000/examples/normalprobability',
  selector: '#vis-element',
  delay: 1000,
  threshold: 0.001
});
