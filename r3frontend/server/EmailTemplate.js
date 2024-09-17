"use strict";

var React = require('react');
var _require = require('@react-email/components'),
  Html = _require.Html,
  Head = _require.Head,
  Body = _require.Body,
  Container = _require.Container,
  Section = _require.Section,
  Img = _require.Img,
  Text = _require.Text,
  Link = _require.Link,
  Button = _require.Button,
  Heading = _require.Heading;
var EmailTemplate = function EmailTemplate(_ref) {
  var name = _ref.name;
  return /*#__PURE__*/React.createElement(Html, null, /*#__PURE__*/React.createElement(Head, null), /*#__PURE__*/React.createElement(Body, {
    style: main
  }, /*#__PURE__*/React.createElement(Container, null, /*#__PURE__*/React.createElement(Section, {
    className: "my-[16px]"
  }, /*#__PURE__*/React.createElement(Img, {
    alt: "Kasr El Badi",
    className: "w-full rounded-[12px] object-cover",
    height: "320",
    src: "https://res.cloudinary.com/diu1hrmqp/image/upload/v1726538999/image-qsar_s9e2n9.jpg"
  }), /*#__PURE__*/React.createElement(Section, {
    className: "mt-[32px] text-center"
  }, /*#__PURE__*/React.createElement(Text, {
    className: "my-[16px] text-[18px] font-semibold leading-[28px] text-indigo-600"
  }, "Thank you for your visit"), /*#__PURE__*/React.createElement(Heading, {
    as: "h1",
    className: "m-0 mt-[8px] text-[36px] font-semibold leading-[36px] text-gray-900"
  }, "Your Experience at Kasr El Badi"), /*#__PURE__*/React.createElement(Text, {
    className: "text-[16px] leading-[24px] text-gray-500"
  }, "Dear ", name, ", we hope you enjoyed your visit to our historic palace. Your feedback is invaluable in helping us improve and provide even better experiences for future visitors."), /*#__PURE__*/React.createElement(Button, {
    className: "mt-[16px] rounded-[8px] bg-indigo-600 px-[40px] py-[12px] font-semibold text-white",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSeNNHo_-PPcGWuyjHIVzce-Qnwaffn-4XLjaVt3NjIW6p8vag/viewform?usp=sf_link"
  }, "Rate Your Experience"))))));
};
var main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
module.exports = {
  EmailTemplate: EmailTemplate
};

//# sourceMappingURL=EmailTemplate.js.map