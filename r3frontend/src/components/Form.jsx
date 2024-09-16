import React, { useState, useCallback } from "react";
import Select from "react-select";
import Flag from "react-world-flags";
import axios from 'axios';



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
    { code: "AF", label: "Afghan" },
    { code: "AL", label: "Albanian" },
    { code: "DZ", label: "Algerian" },
    { code: "US", label: "American" },
    { code: "AD", label: "Andorran" },
    { code: "AO", label: "Angolan" },
    { code: "AR", label: "Argentine" },
    { code: "AM", label: "Armenian" },
    { code: "AU", label: "Australian" },
    { code: "AT", label: "Austrian" },
    { code: "AZ", label: "Azerbaijani" },
    { code: "BS", label: "Bahamian" },
    { code: "BH", label: "Bahraini" },
    { code: "BD", label: "Bangladeshi" },
    { code: "BB", label: "Barbadian" },
    { code: "BY", label: "Belarusian" },
    { code: "BE", label: "Belgian" },
    { code: "BZ", label: "Belizean" },
    { code: "BJ", label: "Beninese" },
    { code: "BT", label: "Bhutanese" },
    { code: "BO", label: "Bolivian" },
    { code: "BA", label: "Bosnian" },
    { code: "BW", label: "Botswanan" },
    { code: "BR", label: "Brazilian" },
    { code: "GB", label: "British" },
    { code: "BN", label: "Bruneian" },
    { code: "BG", label: "Bulgarian" },
    { code: "BF", label: "Burkinabe" },
    { code: "MM", label: "Burmese" },
    { code: "BI", label: "Burundian" },
    { code: "KH", label: "Cambodian" },
    { code: "CM", label: "Cameroonian" },
    { code: "CA", label: "Canadian" },
    { code: "CV", label: "Cape Verdean" },
    { code: "CF", label: "Central African" },
    { code: "TD", label: "Chadian" },
    { code: "CL", label: "Chilean" },
    { code: "CN", label: "Chinese" },
    { code: "CO", label: "Colombian" },
    { code: "KM", label: "Comoran" },
    { code: "CG", label: "Congolese" },
    { code: "CR", label: "Costa Rican" },
    { code: "HR", label: "Croatian" },
    { code: "CU", label: "Cuban" },
    { code: "CY", label: "Cypriot" },
    { code: "CZ", label: "Czech" },
    { code: "DK", label: "Danish" },
    { code: "DJ", label: "Djiboutian" },
    { code: "DM", label: "Dominican" },
    { code: "DO", label: "Dominican Republic" },
    { code: "NL", label: "Dutch" },
    { code: "TL", label: "East Timorese" },
    { code: "EC", label: "Ecuadorian" },
    { code: "EG", label: "Egyptian" },
    { code: "SV", label: "Salvadoran" },
    { code: "GQ", label: "Equatorial Guinean" },
    { code: "ER", label: "Eritrean" },
    { code: "EE", label: "Estonian" },
    { code: "ET", label: "Ethiopian" },
    { code: "FJ", label: "Fijian" },
    { code: "FI", label: "Finnish" },
    { code: "FR", label: "French" },
    { code: "GA", label: "Gabonese" },
    { code: "GM", label: "Gambian" },
    { code: "GE", label: "Georgian" },
    { code: "DE", label: "German" },
    { code: "GH", label: "Ghanaian" },
    { code: "GR", label: "Greek" },
    { code: "GD", label: "Grenadian" },
    { code: "GT", label: "Guatemalan" },
    { code: "GN", label: "Guinean" },
    { code: "GW", label: "Guinea-Bissauan" },
    { code: "GY", label: "Guyanese" },
    { code: "HT", label: "Haitian" },
    { code: "HN", label: "Honduran" },
    { code: "HU", label: "Hungarian" },
    { code: "IS", label: "Icelander" },
    { code: "IN", label: "Indian" },
    { code: "ID", label: "Indonesian" },
    { code: "IR", label: "Iranian" },
    { code: "IQ", label: "Iraqi" },
    { code: "IE", label: "Irish" },
    { code: "IL", label: "Israeli" },
    { code: "IT", label: "Italian" },
    { code: "CI", label: "Ivorian" },
    { code: "JM", label: "Jamaican" },
    { code: "JP", label: "Japanese" },
    { code: "JO", label: "Jordanian" },
    { code: "KZ", label: "Kazakh" },
    { code: "KE", label: "Kenyan" },
    { code: "KI", label: "Kiribati" },
    { code: "KW", label: "Kuwaiti" },
    { code: "KG", label: "Kyrgyz" },
    { code: "LA", label: "Laotian" },
    { code: "LV", label: "Latvian" },
    { code: "LB", label: "Lebanese" },
    { code: "LR", label: "Liberian" },
    { code: "LY", label: "Libyan" },
    { code: "LI", label: "Liechtensteiner" },
    { code: "LT", label: "Lithuanian" },
    { code: "LU", label: "Luxembourger" },
    { code: "MK", label: "Macedonian" },
    { code: "MG", label: "Malagasy" },
    { code: "MW", label: "Malawian" },
    { code: "MY", label: "Malaysian" },
    { code: "MV", label: "Maldivian" },
    { code: "ML", label: "Malian" },
    { code: "MT", label: "Maltese" },
    { code: "MH", label: "Marshallese" },
    { code: "MR", label: "Mauritanian" },
    { code: "MU", label: "Mauritian" },
    { code: "MX", label: "Mexican" },
    { code: "FM", label: "Micronesian" },
    { code: "MD", label: "Moldovan" },
    { code: "MC", label: "Monacan" },
    { code: "MN", label: "Mongolian" },
    { code: "ME", label: "Montenegrin" },
    { code: "MA", label: "Moroccan" },
    { code: "MZ", label: "Mozambican" },
    { code: "NA", label: "Namibian" },
    { code: "NR", label: "Nauruan" },
    { code: "NP", label: "Nepalese" },
    { code: "NZ", label: "New Zealander" },
    { code: "NI", label: "Nicaraguan" },
    { code: "NE", label: "Nigerien" },
    { code: "NG", label: "Nigerian" },
    { code: "NO", label: "Norwegian" },
    { code: "OM", label: "Omani" },
    { code: "PK", label: "Pakistani" },
    { code: "PW", label: "Palauan" },
    { code: "PS", label: "Palestinian" },
    { code: "PA", label: "Panamanian" },
    { code: "PG", label: "Papua New Guinean" },
    { code: "PY", label: "Paraguayan" },
    { code: "PE", label: "Peruvian" },
    { code: "PH", label: "Filipino" },
    { code: "PL", label: "Polish" },
    { code: "PT", label: "Portuguese" },
    { code: "QA", label: "Qatari" },
    { code: "RO", label: "Romanian" },
    { code: "RU", label: "Russian" },
    { code: "RW", label: "Rwandan" },
    { code: "KN", label: "Saint Kitts and Nevis" },
    { code: "LC", label: "Saint Lucian" },
    { code: "VC", label: "Saint Vincent and the Grenadines" },
    { code: "WS", label: "Samoan" },
    { code: "SM", label: "San Marinese" },
    { code: "ST", label: "Sao Tomean" },
    { code: "SA", label: "Saudi" },
    { code: "SN", label: "Senegalese" },
    { code: "RS", label: "Serbian" },
    { code: "SC", label: "Seychellois" },
    { code: "SL", label: "Sierra Leonean" },
    { code: "SG", label: "Singaporean" },
    { code: "SK", label: "Slovak" },
    { code: "SI", label: "Slovenian" },
    { code: "SB", label: "Solomon Islander" },
    { code: "SO", label: "Somali" },
    { code: "ZA", label: "South African" },
    { code: "KR", label: "South Korean" },
    { code: "ES", label: "Spanish" },
    { code: "LK", label: "Sri Lankan" },
    { code: "SD", label: "Sudanese" },
    { code: "SR", label: "Surinamer" },
    { code: "SZ", label: "Swazi" },
    { code: "SE", label: "Swedish" },
    { code: "CH", label: "Swiss" },
    { code: "SY", label: "Syrian" },
    { code: "TW", label: "Taiwanese" },
    { code: "TJ", label: "Tajik" },
    { code: "TZ", label: "Tanzanian" },
    { code: "TH", label: "Thai" },
    { code: "TG", label: "Togolese" },
    { code: "TO", label: "Tongan" },
    { code: "TT", label: "Trinidadian/Tobagonian" },
    { code: "TN", label: "Tunisian" },
    { code: "TR", label: "Turkish" },
    { code: "TM", label: "Turkmen" },
    { code: "TV", label: "Tuvaluan" },
    { code: "UG", label: "Ugandan" },
    { code: "UA", label: "Ukrainian" },
    { code: "AE", label: "Emirati" },
    { code: "UY", label: "Uruguayan" },
    { code: "UZ", label: "Uzbek" },
    { code: "VU", label: "Vanuatuan" },
    { code: "VA", label: "Vatican" },
    { code: "VE", label: "Venezuelan" },
    { code: "VN", label: "Vietnamese" },
    { code: "YE", label: "Yemeni" },
    { code: "ZM", label: "Zambian" },
    { code: "ZW", label: "Zimbabwean" },
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
            <div className="w-full"> {/* Div mère */}
              <label htmlFor="nationality" className="block text-sm font-medium leading-6 text-gray-900">Nationality</label>
              <div className="mt-2 w-full"> {/* Div fille */}
                <Select
                  options={countries.map((country) => ({
                    value: country.label,
                    label: (
                      <div className="flex items-center">
                        <Flag code={country.code} style={{ width: 30, marginRight: 10 }} />
                        {country.label}
                      </div>
                    ),
                  }))}
                  value={formData.nationality}
                  onChange={handleNationalityChange}
                  required
                  className="block w-full"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: '38px',
                      height: '38px',
                      width: '100%',
                    }),
                    container: (provided) => ({
                      ...provided,
                      width: '100%',
                    }),
                    valueContainer: (provided) => ({
                      ...provided,
                      height: '38px',
                      padding: '0 6px',
                    }),
                    input: (provided) => ({
                      ...provided,
                      margin: '0px',
                    }),
                    indicatorSeparator: () => ({
                      display: 'none',
                    }),
                    indicatorsContainer: (provided) => ({
                      ...provided,
                      height: '38px',
                    }),
                  }}
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 6,
                    colors: {
                      ...theme.colors,
                      primary25: '#f3f4f6',
                      primary: '#f97316',
                    },
                  })}
                />
                {errors.nationality && <p className="mt-2 text-sm text-red-600">{errors.nationality}</p>}
              </div>
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