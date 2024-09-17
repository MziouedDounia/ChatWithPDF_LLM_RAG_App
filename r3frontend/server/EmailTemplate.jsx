const React = require('react');
const { Html, Head, Body, Container, Section, Img, Text, Link, Button, Heading } = require('@react-email/components');

const EmailTemplate = ({ name }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container>
        <Section className="my-[16px]">
          <Img
            alt="Kasr El Badi"
            className="w-full rounded-[12px] object-cover"
            height="320"
            src="https://res.cloudinary.com/diu1hrmqp/image/upload/v1726538999/image-qsar_s9e2n9.jpg"
          />
          <Section className="mt-[32px] text-center">
            <Text className="my-[16px] text-[18px] font-semibold leading-[28px] text-indigo-600">
              Thank you for your visit
            </Text>
            <Heading
              as="h1"
              className="m-0 mt-[8px] text-[36px] font-semibold leading-[36px] text-gray-900"
            >
              Your Experience at Kasr El Badi
            </Heading>
            <Text className="text-[16px] leading-[24px] text-gray-500">
              Dear {name}, we hope you enjoyed your visit to our historic palace. Your feedback is invaluable in helping us improve and provide even better experiences for future visitors.
            </Text>
            <Button
              className="mt-[16px] rounded-[8px] bg-indigo-600 px-[40px] py-[12px] font-semibold text-white"
              href="https://docs.google.com/forms/d/e/1FAIpQLSeNNHo_-PPcGWuyjHIVzce-Qnwaffn-4XLjaVt3NjIW6p8vag/viewform?usp=sf_link"
            >
              Rate Your Experience
            </Button>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

module.exports = { EmailTemplate };