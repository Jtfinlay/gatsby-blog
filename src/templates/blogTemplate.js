import React from 'react';

import './blogTemplate.scss';

export default function Template({
    data
  }) {
    const { markdownRemark } = data;
    const { frontmatter, html } = markdownRemark;
    return (
      <div className='blog-post-container'>
        <div className='blog-post'>
          <h1>{ frontmatter.title }</h1>
          <h3 className='date'>{ frontmatter.date }</h3>
          <div
            className='blog-post-content'
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    );
  }

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        path
        tags
      }
    }
  }
`;