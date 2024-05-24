import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Administration',
    Svg: require('@site/static/img/toolbox-solid.svg').default,
    to: './docs/administration/intro',
    description: (
      <>
        Learn how to setup and configure a PILOS server for your organization.
      </>
    )
  },
  {
    title: 'Development',
    Svg: require('@site/static/img/laptop-code-solid.svg').default,
    to: './docs/development/intro',
    description: (
      <>
        Learn how to contribute to the PILOS project and develop new features.
      </>
    )
  }
];

function Feature ({ Svg, title, description, to }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <a href={to}>Read more</a>
      </div>
    </div>
  );
}

export default function HomepageFeatures () {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
