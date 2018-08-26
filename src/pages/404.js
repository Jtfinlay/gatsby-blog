import React from 'react';
import Img from 'gatsby-image';

const NotFoundPage = ({ data }) => (
  <div>
    <h1>NOT FOUND</h1>
    <p>You just hit a route that doesn&#39;t exist... the sadness. Here's a picture of Bagel to make up for it.</p>
    <Img resolutions={ data.notFoundImage.resolutions } />
  </div>
);

export default NotFoundPage;

export const pageQuery = graphql`
    query NotFoundQuery {
        notFoundImage: imageSharp(id: { regex: "/bagel_blanket.jpg/" }) {
            resolutions(width: 338, height: 518) {
                ...GatsbyImageSharpResolutions
            }
        }
    }
`;