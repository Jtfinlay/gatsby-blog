import React from 'react';
import Link from 'gatsby-link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons';

import './post-link.scss';

const PostLink = ({ post }) => (
  <div className='post-block container'>
    <div className='metadata'>
        <div className='tags'>{ post.frontmatter.tags }</div>
        <div className='date'>{ post.frontmatter.date }</div>
    </div>
    <div className='title'>
        <h1><Link to={ post.frontmatter.path }>{ post.frontmatter.title }</Link></h1>
    </div>
    <div className='excerpt'>
        { post.excerpt }
        <Link to={ post.frontmatter.path } className='read-more'>
            <FontAwesomeIcon icon={faLongArrowAltRight} />
        </Link>
    </div>
  </div>
);

export default PostLink;