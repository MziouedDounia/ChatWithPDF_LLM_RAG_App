// Formulaire.jsx
import React from "react";
import { Form } from "../components/Form";

const Formulaire = ({ onSubmit, onContinueAsGuest }) => {
  return (
    <Form onSubmit={onSubmit} onContinueAsGuest={onContinueAsGuest} />
  );
};

export default Formulaire;