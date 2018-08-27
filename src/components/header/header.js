import React from 'react';
import Link from 'gatsby-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faRss } from '@fortawesome/free-solid-svg-icons';
import { OutboundLink } from 'gatsby-plugin-google-analytics';

import './header.scss';

const Header = () => (
  <div className='header_block'>
    <div className='header'>
            <ul className='navMenu'>
                <li className='navMenuItem'>
                    <Link to='/'>James Finlay</Link>
                </li>
                <li className='navMenuItem'>
                    <Link to='/about'>about</Link>
                </li>
            </ul>
            <ul className='socialIcons'>
                <li className='socialIcon_link'>
                    <OutboundLink href='https://twitter.com/JtFinlay' className='fa twitter'>
                        <FontAwesomeIcon icon={faTwitter} />
                    </OutboundLink>
                </li>
                <li className='socialIcon_link'>
                    <OutboundLink href='https://github.com/Jtfinlay' className='fa github'>
                        <FontAwesomeIcon icon={faGithub} />
                    </OutboundLink>
                </li>
                <li className='socialIcon_link'>
                    <OutboundLink href='https://www.linkedin.com/in/james-finlay-b204a731/' className='fa linkedin'>
                        <FontAwesomeIcon icon={faLinkedin} />
                    </OutboundLink>
                </li>
                <li className='socialIcon_link'>
                    <OutboundLink href='http://feeds.feedburner.com/jtfinlay' className='fa rss'>
                        <FontAwesomeIcon icon={faRss} />
                    </OutboundLink>
                </li>
            </ul>
        </div>
    </div>
);

export default Header;
