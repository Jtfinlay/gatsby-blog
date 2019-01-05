import React from 'react';
import PostLink from "../components/post-link";
import Img from 'gatsby-image';

const IndexPage = ({
    data
}) => {
    const posts = data.allMarkdownRemark.edges
        .filter(edge => !!edge.node.frontmatter.date)
        .map(edge => <PostLink key={edge.node.id} post={edge.node} />);

    return (
        <div>
            <Img sizes={ data.spotlightImage.sizes } />
            <div>{ posts }</div>
        </div>
    );
};

export default IndexPage;

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
    spotlightImage: imageSharp(id: { regex: "/portrait_landscape.jpg/" }) {
        sizes(maxHeight: 350, cropFocus: ENTROPY) {
            ...GatsbyImageSharpSizes
        }
    }
  }
`;