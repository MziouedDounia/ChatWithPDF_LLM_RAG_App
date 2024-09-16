import React, { useState, useCallback } from "react";
import Select from "react-select";
import Flag from "react-world-flags";
import axios from 'axios';

const CustomOption = ({ innerProps, label, data }) => (
  <div {...innerProps} className="flex items-center p-2 cursor-pointer hover:bg-gray-100">
    <Flag code={data.code} className="w-5 h-3 mr-3" />
    <span>{label}</span>
  </div>
);

const CustomSingleValue = ({ children, data }) => (
  <div className="flex items-center">
    <Flag code={data.code} className="w-5 h-3 mr-3" />
    <span>{children}</span>
  </div>
);

export const Form = ({ onSubmit, onContinueAsGuest }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nationality: null,
    visitedKasrElBadi: null
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // List of all nationalities with country codes (ISO 3166-1 Alpha-2)
  const countries = [
    { code: "FR", label: "French" },
    { code: "US", label: "American" },
    { code: "GB", label: "British" },
    // ... Add other countries here
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const handleNationalityChange = useCallback((selectedOption) => {
    setFormData(prev => ({ ...prev, nationality: selectedOption }));
    setErrors(prev => ({ ...prev, nationality: '' }));
  }, []);

  const handleRadioChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, visitedKasrElBadi: value }));
    setErrors(prev => ({ ...prev, visitedKasrElBadi: '' }));
  }, []);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.nationality) newErrors.nationality = 'Nationality is required';
    if (formData.visitedKasrElBadi === null) newErrors.visitedKasrElBadi = 'Please select an option';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validateForm()) return;
    const submissionData = {
      name: formData.name,
      email: formData.email,
      nationality: formData.nationality?.value,
      isKasrElBadiVisited: formData.visitedKasrElBadi === "yes"
    };
    try {
      const response = await axios.post('http://localhost:5000/api/credentials', submissionData);
      setMessage(`User added with ID: ${response.data.id}`);
      onSubmit(submissionData);
    } catch (error) {
      setMessage('Error submitting form. Please try again.');
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to RedCityGuide!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please fill in the form below to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div>
  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
    Nationality
  </label>
  <Select
    options={countries}
    value={formData.nationality}
    onChange={handleNationalityChange}
    components={{
      Option: CustomOption,
      SingleValue: CustomSingleValue,
    }}
    styles={{
      control: (base, state) => ({
        ...base,
        borderColor: errors.nationality ? '#f56565' : state.isFocused ? '#f97316' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #f97316' : 'none',
        '&:hover': {
          borderColor: state.isFocused ? '#f97316' : '#9ca3af',
        },
        minHeight: '38px', // Réduire la hauteur minimale
        padding: '0 8px', // Ajuster le padding
      }),
      valueContainer: (base) => ({
        ...base,
        padding: '0 6px', // Réduire le padding interne
      }),
      singleValue: (base) => ({
        ...base,
        margin: '0', // Supprimer la marge
        color: '#000',
      }),
      input: (base) => ({
        ...base,
        margin: '0', // Supprimer la marge
        padding: '0', // Supprimer le padding
      }),
      placeholder: (base) => ({
        ...base,
        color: '#9ca3af',
        margin: '0', // Supprimer la marge
      }),
      indicatorsContainer: (base) => ({
        ...base,
        height: '38px', // Ajuster la hauteur des indicateurs
      }),
    }}
    placeholder="Select nationality..."
    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
  />
  {errors.nationality && <p className="mt-2 text-sm text-red-600">{errors.nationality}</p>}
</div>
<div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Have you ever visited Kasr El Badi?</span>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleRadioChange("yes")}
                  className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                    formData.visitedKasrElBadi === "yes"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleRadioChange("no")}
                  className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                    formData.visitedKasrElBadi === "no"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  No
                </button>
              </div>
              {errors.visitedKasrElBadi && <p className="mt-2 text-sm text-red-600">{errors.visitedKasrElBadi}</p>}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Submit
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={onContinueAsGuest}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
        {message && (
          <div className="mt-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;