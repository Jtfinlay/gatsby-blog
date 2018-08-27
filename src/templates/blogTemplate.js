import React from 'react';
import Disqus from 'disqus-react';

import './blogTemplate.scss';

export default function Template({
    data
}) {
    const { markdownRemark } = data;
    const { frontmatter, html } = markdownRemark;

    const disqusShortname = 'blog-jtfinlay';
    const disqusConfig = {
        url: frontmatter.path,
        identifier: markdownRemark.id,
        title: frontmatter.title,
    };

    return (
      <div className='blog-post-container'>
        <div className='blog-post'>
          <h1>{ frontmatter.title }</h1>
          <h3 className='date'>{ frontmatter.date }</h3>
          <div
            className='blog-post-content'
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <Disqus.DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />
        </div>
      </div>
    );
  }

export const pageQuery = graphql`
    query BlogPostByPath($path: String!) {
        markdownRemark(frontmatter: { path: { eq: $path } }) {
            id
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