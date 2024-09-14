import { useState } from "react";
import Select from "react-select";
import Flag from "react-world-flags";
import axios from 'axios';

export const Form = ({ onSubmit, onContinueAsGuest }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState(null);
  const [visitedKasrElBadi, setVisitedKasrElBadi] = useState(null); 
  const [message, setMessage] = useState('');

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


  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit({ name, email, nationality, visitedKasrElBadi });
    // Create the form data object
    const formData = {
      name,
      email,
      nationality: nationality?.value,  
      isKasrElBadiVisited: visitedKasrElBadi
    };

    try {
      const response = await axios.post('http://localhost:5000/api/credentials', formData);
      setMessage(`User added with ID: ${response.data.id}`);
    } catch (error) {
      setMessage('Error submitting form');
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Welcome to RedCityGuide !</h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Name</label>
            <div className="mt-2">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email address</label>
            <div className="mt-2">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nationality" className="block text-sm font-medium leading-6 text-gray-900">Nationality</label>
            <div className="mt-2">
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
                value={nationality}
                onChange={(selectedOption) => setNationality(selectedOption)}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium leading-6 text-gray-900">Have you ever visited Kasr El Badi?</span>
            <div className="mt-2 flex space-x-4">
              <label htmlFor="yes" className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="yes"
                  value="yes"
                  checked={visitedKasrElBadi === "yes"}
                  onChange={() => setVisitedKasrElBadi("yes")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">Yes</span>
              </label>
              <label htmlFor="no" className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="no"
                  value="no"
                  checked={visitedKasrElBadi === "no"}
                  onChange={() => setVisitedKasrElBadi("no")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-900">No</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button type="submit" className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Submit</button>
            <button type="button" onClick={onContinueAsGuest} className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-300">Continue as guest</button>
          </div>
        </form>
        {message && <p className="mt-4 text-center text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  );
};
