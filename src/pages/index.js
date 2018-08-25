import React from 'react';
import PostLink from "../components/post-link";

const IndexPage = ({
    data: {
      allMarkdownRemark: { edges },
    },
}) => {
    const posts = edges
        .filter(edge => !!edge.node.frontmatter.date)
        .map(edge => <PostLink key={edge.node.id} post={edge.node} />);

    return (
        <div>
            <h1>Hi people</h1>
            <p>Welcome to your new Gatsby site.</p>
            <p>Now go build something great.</p>
            <div>{ posts }</div>
        </div>
    );
};

export default IndexPage

export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          id
          excerpt(pruneLength: 300)
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            path
            title
            tags
          }
        }
      }
    }
  }
`;