import React from 'react';
import Link from 'gatsby-link';

import './post-link.scss';

const PostLink = ({ post }) => (
  <div className='post-block'>
    <div className='metadata'>
        <div className='date'>{ post.frontmatter.date }</div>
        <div className='tags'>{ post.frontmatter.tags }</div>
    </div>
    <div className='title'>
        <h1><Link to={ post.frontmatter.path }>{ post.frontmatter.title }</Link></h1>
    </div>
    <div className='excerpt'>
        { post.excerpt }
    </div>
  </div>
);

export default PostLink;