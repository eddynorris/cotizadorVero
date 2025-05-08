import { useState, useEffect } from 'react';
import Papa from 'papaparse'; // Importa papaparse

// ------------------------------------------------------------------------------------
// ¡¡¡IMPORTANTE!!! REEMPLAZA ESTA URL CON LA URL DE TU PROPIA HOJA DE GOOGLE PUBLICADA COMO CSV
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzV-vPTA67-s1VEaOwH5mUNC8wy1kz9UwzE93e5PwjL5Ve0-3JFgV28MNVOGiDEL4DjsdLzXVrhRDI/pub?output=csv';
// Ejemplo: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS.../pub?output=csv'
// ------------------------------------------------------------------------------------


// Ubicaciones predeterminadas para logos
const defaultLogoLocations = [
  "Hombro derecho",
  "Hombro izquierdo",
  "Manga derecha",
  "Manga izquierda",
  "Pecho",
  "Espalda"
];

// Costo adicional por color extra en logo (predeterminado)
const defaultExtraColorPrice = 1.25;

export default function QuotationSystem() {
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [errorInventory, setErrorInventory] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [logos, setLogos] = useState([]);
  const [quotationDetails, setQuotationDetails] = useState(null);
  const [notification, setNotification] = useState("");

  const [logoPrices, setLogoPrices] = useState({
    "Hombro derecho": 2.50,
    "Hombro izquierdo": 2.50,
    "Manga derecha": 3.00,
    "Manga izquierda": 3.00,
    "Pecho": 3.50,
    "Espalda": 4.00
  });

  const [extraColorPrice, setExtraColorPrice] = useState(defaultExtraColorPrice);
  const [showConfig, setShowConfig] = useState(false);

  // Estado para filtros de selección
  const [selectedType, setSelectedType] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (GOOGLE_SHEET_CSV_URL === 'URL_DE_TU_HOJA_DE_GOOGLE_PUBLICADA_COMO_CSV') {
        setErrorInventory("Por favor, configura la URL de la Hoja de Google en el código fuente (GOOGLE_SHEET_CSV_URL).");
        setLoadingInventory(false);
        return;
      }

      try {
        setLoadingInventory(true);
        setErrorInventory(null);
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          dynamicTyping: false, // Desactivamos dynamicTyping para un control manual más robusto
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
                console.error("Errores de parseo CSV:", results.errors);
                setErrorInventory("Error al procesar algunas filas del inventario. Revisa la consola.");
            }
            const formattedData = results.data.map((item, index) => ({
              no: parseInt(item.no, 10) || (index + 1), // Asegura un 'no' aunque sea por índice
              type: String(item.type || "").trim(),
              manufacturer: String(item.manufacturer || "").trim(),
              item: String(item.item || "").trim(),
              productNumber: String(item.productNumber || "").trim(),
              color: String(item.color || "").trim(),
              size: String(item.size || "").trim(),
              quantity: parseInt(item.quantity, 10) || 0,
              cost: parseFloat(item.cost) || 0,
              extension: String(item.extension || "").trim(),
              sellingPrice: parseFloat(item.sellingPrice) || parseFloat(item.cost) || 0, // sellingPrice usa cost si está vacío
            }));
            setInventory(formattedData);
            if (formattedData.length === 0 && !results.errors.length) {
                setNotification("Inventario cargado pero está vacío o el formato no es el esperado.");
            }
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            setErrorInventory("Error al procesar los datos del inventario. Verifica el formato CSV.");
          }
        });
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        setErrorInventory(`No se pudo cargar el inventario: ${error.message}. Verifica la URL y la publicación de la hoja.`);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventoryData();
  }, []);


  // Conseguir listas de valores únicos para selectores
  const uniqueTypes = inventory.length > 0 ? [...new Set(inventory.map(item => item.type).filter(Boolean))] : [];
  const uniqueManufacturers = inventory.length > 0 ? [...new Set(inventory.map(item => item.manufacturer).filter(Boolean))] : [];
  const uniqueItems = inventory.length > 0 ? [...new Set(inventory.map(item => item.item).filter(Boolean))] : [];
  // uniqueSizes se recalculará en getFilteredSizes


  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSelectedManufacturer('');
    setSelectedItemName('');
    setSelectedSize('');
    setSelectedItem(null);
  };

  const handleManufacturerSelect = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setSelectedItemName('');
    setSelectedSize('');
    setSelectedItem(null);
  };

  const handleItemSelect = (itemName) => {
    setSelectedItemName(itemName);
    setSelectedSize('');
    setSelectedItem(null);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const foundItem = inventory.find(item =>
      item.type === selectedType &&
      item.manufacturer === selectedManufacturer &&
      item.item === selectedItemName &&
      item.size === size
    );
    setSelectedItem(foundItem || null); // Asegurarse que sea null si no se encuentra
    setQuantity(1);
  };

  const getColorOptions = () => {
    if (!selectedItemName || !selectedType || !selectedManufacturer || !selectedSize) return [];
    return [...new Set(inventory
      .filter(item =>
        item.type === selectedType &&
        item.manufacturer === selectedManufacturer &&
        item.item === selectedItemName &&
        item.size === selectedSize
      )
      .map(item => item.color).filter(Boolean))];
  };

  const handleColorChange = (color) => {
    const updatedItem = inventory.find(
      item =>
        item.type === selectedType &&
        item.manufacturer === selectedManufacturer &&
        item.item === selectedItemName &&
        item.size === selectedSize &&
        item.color === color
    );
    setSelectedItem(updatedItem || null);
  };

  const getFilteredManufacturers = () => {
    if (!selectedType) return [];
    return [...new Set(inventory
      .filter(item => item.type === selectedType)
      .map(item => item.manufacturer).filter(Boolean))];
  };

  const getFilteredItems = () => {
    if (!selectedManufacturer || !selectedType) return [];
    return [...new Set(inventory
      .filter(item =>
        item.type === selectedType &&
        item.manufacturer === selectedManufacturer
      )
      .map(item => item.item).filter(Boolean))];
  };

  const getFilteredSizes = () => {
    if (!selectedItemName || !selectedManufacturer || !selectedType) return [];
    return [...new Set(inventory
      .filter(item =>
        item.type === selectedType &&
        item.manufacturer === selectedManufacturer &&
        item.item === selectedItemName
      )
      .map(item => item.size).filter(Boolean))];
  };

  const addLogoLocation = () => {
    const newLocation = prompt("Ingrese el nombre de la nueva ubicación:");
    if (newLocation && !logoPrices[newLocation]) {
      const newPrice = parseFloat(prompt("Ingrese el precio para esta ubicación:")) || 0;
      setLogoPrices({ ...logoPrices, [newLocation]: newPrice });
    } else if (newLocation) {
        setNotification("Esa ubicación ya existe.");
        setTimeout(() => setNotification(""), 3000);
    }
  };

  const updateLogoPrice = (location, price) => {
    setLogoPrices({ ...logoPrices, [location]: price });
  };

  const removeLogoLocation = (location) => {
    if (!defaultLogoLocations.includes(location)) {
      const newPrices = { ...logoPrices };
      delete newPrices[location];
      setLogoPrices(newPrices);
      // Si se elimina la ubicación de un logo existente, actualizar ese logo a una ubicación por defecto
      setLogos(prevLogos => prevLogos.map(logo => {
        if (logo.location === location) {
          return {...logo, location: Object.keys(newPrices)[0] || ""};
        }
        return logo;
      }).filter(logo => logo.location !== "")); // Eliminar logos si no quedan ubicaciones
    } else {
      setNotification("No se puede eliminar una ubicación predeterminada.");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const addLogo = () => {
    if (Object.keys(logoPrices).length === 0) {
        setNotification("No hay ubicaciones de logo configuradas. Añada una en Configuración.");
        setTimeout(() => setNotification(""), 3000);
        return;
    }
    const newLogo = {
      id: Date.now(),
      location: Object.keys(logoPrices)[0], // Usa la primera ubicación disponible
      colors: 1
    };
    setLogos([...logos, newLogo]);
  };

  const removeLogo = (logoId) => {
    setLogos(logos.filter(logo => logo.id !== logoId));
  };

  const updateLogo = (logoId, field, value) => {
    setLogos(logos.map(logo => {
      if (logo.id === logoId) {
        return { ...logo, [field]: (field === 'colors' ? parseInt(value,10) || 1 : value) };
      }
      return logo;
    }));
  };

  const calculateLogoPrice = (logo) => {
    const basePrice = logoPrices[logo.location] || 0;
    const extraColors = Math.max(0, logo.colors - 1);
    const extraColorsPriceVal = extraColors * extraColorPrice;
    return basePrice + extraColorsPriceVal;
  };

  const generateQuotation = () => {
    if (!selectedItem || quantity <= 0) {
      setNotification("Por favor seleccione un producto y cantidad válida.");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    if (selectedItem.quantity < quantity) {
      setNotification(`Inventario insuficiente. Solo hay ${selectedItem.quantity} unidades disponibles.`);
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    const baseItemPrice = selectedItem.sellingPrice;
    const baseTotal = baseItemPrice * quantity;

    const logoDetails = logos.map(logo => {
      const logoPrice = calculateLogoPrice(logo);
      return {
        location: logo.location,
        colors: logo.colors,
        pricePerUnit: logoPrice,
        totalPrice: logoPrice * quantity
      };
    });

    const logoTotal = logoDetails.reduce((sum, logo) => sum + logo.totalPrice, 0);
    const grandTotal = baseTotal + logoTotal;

    setQuotationDetails({
      product: selectedItem.item,
      no: selectedItem.no,
      type: selectedItem.type,
      manufacturer: selectedItem.manufacturer,
      productNumber: selectedItem.productNumber,
      color: selectedItem.color,
      size: selectedItem.size,
      quantity: quantity,
      unitPrice: baseItemPrice,
      cost: selectedItem.cost,
      extension: selectedItem.extension,
      baseTotal: baseTotal,
      logoDetails: logoDetails,
      logoTotal: logoTotal,
      grandTotal: grandTotal
    });
  };

  const confirmQuotation = () => {
    if (!quotationDetails) return;

    // Actualizar el inventario en el estado local
    const updatedInventory = inventory.map(item => {
      if (item.no === selectedItem.no && item.productNumber === selectedItem.productNumber) { // Mejor usar productNumber para más unicidad
        return { ...item, quantity: item.quantity - quantity };
      }
      return item;
    });

    setInventory(updatedInventory);
    setNotification("¡Cotización confirmada! Inventario local actualizado.");
    // NOTA: Esto NO actualiza la hoja de Google Sheets.
    // Para eso, necesitarías una API o actualizarla manualmente.
    console.log("Inventory updated locally:", updatedInventory);

    setTimeout(() => {
      setNotification("");
      setSelectedItem(null);
      setSelectedType('');
      setSelectedManufacturer('');
      setSelectedItemName('');
      setSelectedSize('');
      setQuantity(1);
      setLogos([]);
      setQuotationDetails(null);
    }, 3000);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setSelectedType('');
    setSelectedManufacturer('');
    setSelectedItemName('');
    setSelectedSize('');
    setQuantity(1);
    setLogos([]);
    setQuotationDetails(null);
    setNotification("");
  }

  // Renderizado condicional mientras carga el inventario
  if (loadingInventory) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-blue-700">Cargando inventario...</div>
      </div>
    );
  }

  // Renderizado condicional si hay un error al cargar el inventario
  if (errorInventory) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error al Cargar Inventario</h2>
          <p>{errorInventory}</p>
          {GOOGLE_SHEET_CSV_URL === 'URL_DE_TU_HOJA_DE_GOOGLE_PUBLICADA_COMO_CSV' && (
             <p className="mt-2 text-sm">Asegúrate de haber reemplazado la URL placeholder en el código.</p>
          )}
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => window.location.reload()} // Intenta recargar la página
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="flex flex-col bg-gray-100 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Sistema de Cotización</h1>
        <button
          className={`px-4 py-2 rounded ${showConfig ? 'bg-gray-500' : 'bg-blue-600'} text-white`}
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? 'Ocultar Configuración' : 'Configuración'}
        </button>
      </div>

      {notification && (
        <div className={`p-4 mb-4 rounded border-l-4 ${notification.startsWith("Error") || notification.startsWith("No se pudo") || notification.startsWith("Inventario insuficiente") ? 'bg-red-100 border-red-500 text-red-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'}`}>
          {notification}
        </div>
      )}

      {showConfig && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-700">Configuración de Precios</h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Precio por color extra:</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-32 p-2 border rounded"
                value={extraColorPrice}
                onChange={(e) => setExtraColorPrice(parseFloat(e.target.value) || 0)}
              />
              <span className="self-center">$</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700">Precios por ubicación:</label>
              <button
                className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                onClick={addLogoLocation}
              >
                + Agregar Ubicación
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(logoPrices).length > 0 ? Object.entries(logoPrices).map(([location, price]) => (
                <div key={location} className="flex justify-between items-center p-2 border rounded">
                  <span>{location}</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 p-1 border rounded"
                      value={price}
                      onChange={(e) => updateLogoPrice(location, parseFloat(e.target.value) || 0)}
                    />
                    <span className="self-center">$</span>
                    {!defaultLogoLocations.includes(location) && (
                      <button
                        className="text-red-500 hover:text-red-700 font-bold"
                        onClick={() => removeLogoLocation(location)}
                        title="Eliminar ubicación"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              )) : <p className="text-sm text-gray-500 italic">No hay ubicaciones de logo definidas.</p>}
            </div>
          </div>
        </div>
      )}

    {inventory.length === 0 && !loadingInventory && !errorInventory && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          <p className="font-semibold">Inventario no disponible</p>
          <p>No se encontraron productos en el inventario. Por favor, verifica la hoja de cálculo de origen o su configuración.</p>
        </div>
    )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Selección de producto */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3 text-blue-700">Selección de Producto</h2>
          {inventory.length === 0 ? <p className="text-gray-500">Cargando opciones de inventario o no hay inventario disponible.</p> : (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tipo:</label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  value={selectedType}
                  disabled={uniqueTypes.length === 0}
                >
                  <option value="">-- {uniqueTypes.length === 0 ? "No hay tipos" : "Todos los tipos"} --</option>
                  {uniqueTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Fabricante:</label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => handleManufacturerSelect(e.target.value)}
                  value={selectedManufacturer}
                  disabled={!selectedType || getFilteredManufacturers().length === 0}
                >
                  <option value="">-- {getFilteredManufacturers().length === 0 && selectedType ? "No hay fabricantes para este tipo" : "Seleccione fabricante"} --</option>
                  {getFilteredManufacturers().map((manufacturer, index) => (
                    <option key={index} value={manufacturer}>{manufacturer}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Producto:</label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => handleItemSelect(e.target.value)}
                  value={selectedItemName}
                  disabled={!selectedManufacturer || getFilteredItems().length === 0}
                >
                  <option value="">-- {getFilteredItems().length === 0 && selectedManufacturer ? "No hay productos para este fabricante" : "Seleccione producto"} --</option>
                  {getFilteredItems().map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tamaño:</label>
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => handleSizeSelect(e.target.value)}
                  value={selectedSize}
                  disabled={!selectedItemName || getFilteredSizes().length === 0}
                >
                  <option value="">-- {getFilteredSizes().length === 0 && selectedItemName ? "No hay tamaños para este producto" : "Seleccione tamaño"} --</option>
                  {getFilteredSizes().map((size, index) => (
                    <option key={index} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {selectedSize && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Color:</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedItem?.color || ""}
                    onChange={(e) => handleColorChange(e.target.value)}
                    disabled={getColorOptions().length === 0}
                  >
                    <option value="">-- {getColorOptions().length === 0 ? "No hay colores" : "Seleccione color"} --</option>
                    {getColorOptions().map((color, index) => (
                      <option key={index} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedItem && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Cantidad:</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      className="w-full p-2 border rounded"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                    <span className={`text-sm ${selectedItem.quantity < quantity && quantity > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      Disponible: {selectedItem.quantity}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <label className="block text-gray-700">Detalles:</label>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p><strong>N° Producto:</strong> {selectedItem.productNumber}</p>
                      <p><strong>Precio unitario:</strong> ${selectedItem.sellingPrice.toFixed(2)}</p>
                      <p><strong>Costo:</strong> ${selectedItem.cost.toFixed(2)}</p>
                      <p><strong>Extensión:</strong> {selectedItem.extension || "N/A"}</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Logos */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-blue-700">Logos</h2>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
              onClick={addLogo}
              disabled={Object.keys(logoPrices).length === 0 || inventory.length === 0}
            >
              + Añadir Logo
            </button>
          </div>

          {Object.keys(logoPrices).length === 0 && <p className="text-sm text-gray-500 italic">No hay ubicaciones de logo configuradas. Vaya a Configuración.</p>}

          {logos.length === 0 && Object.keys(logoPrices).length > 0 ? (
            <p className="text-gray-500 italic">No hay logos agregados</p>
          ) : (
            logos.map(logo => (
              <div key={logo.id} className="mb-4 p-3 border rounded">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Logo #{logos.indexOf(logo) + 1}</h3>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeLogo(logo.id)}
                  >
                    Eliminar
                  </button>
                </div>

                <div className="mb-2">
                  <label className="block text-gray-700 mb-1 text-sm">Ubicación:</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={logo.location}
                    onChange={(e) => updateLogo(logo.id, 'location', e.target.value)}
                    disabled={Object.keys(logoPrices).length === 0}
                  >
                    {Object.keys(logoPrices).length === 0 && <option value="">No hay ubicaciones</option>}
                    {Object.keys(logoPrices).map((location, index) => (
                      <option key={index} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-gray-700 mb-1 text-sm">Número de colores:</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded"
                    value={logo.colors}
                    onChange={(e) => updateLogo(logo.id, 'colors', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>Precio base: ${logoPrices[logo.location]?.toFixed(2) || "0.00"}</p>
                  {logo.colors > 1 && (
                    <p>Extra por {logo.colors - 1} colores adicionales: ${((logo.colors - 1) * extraColorPrice).toFixed(2)}</p>
                  )}
                  <p className="font-semibold">Precio por unidad: ${calculateLogoPrice(logo).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
          onClick={generateQuotation}
          disabled={!selectedItem || inventory.length === 0}
        >
          Generar Cotización
        </button>
        <button
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          onClick={resetForm}
        >
          Limpiar
        </button>
      </div>

      {/* Cotización generada */}
      {quotationDetails && (
        <div className="bg-white p-5 rounded shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-800 border-b pb-2">Detalle de Cotización</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Producto Seleccionado</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p><strong>N°:</strong> {quotationDetails.no}</p>
              <p><strong>Tipo:</strong> {quotationDetails.type}</p>
              <p><strong>Fabricante:</strong> {quotationDetails.manufacturer}</p>
              <p><strong>Producto:</strong> {quotationDetails.product}</p>
              <p><strong>N° Producto:</strong> {quotationDetails.productNumber}</p>
              <p><strong>Color:</strong> {quotationDetails.color}</p>
              <p><strong>Tamaño:</strong> {quotationDetails.size}</p>
              <p><strong>Cantidad:</strong> {quotationDetails.quantity}</p>
              <p><strong>Precio unitario:</strong> ${quotationDetails.unitPrice.toFixed(2)}</p>
              <p><strong>Costo:</strong> ${quotationDetails.cost.toFixed(2)}</p>
              <p><strong>Extensión:</strong> {quotationDetails.extension || "N/A"}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Detalle de Logos</h3>
            {quotationDetails.logoDetails.length === 0 ? (
              <p className="text-gray-500 italic">No hay logos agregados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left font-semibold">Ubicación</th>
                      <th className="p-2 text-left font-semibold">Colores</th>
                      <th className="p-2 text-right font-semibold">Precio Unitario</th>
                      <th className="p-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationDetails.logoDetails.map((logo, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{logo.location}</td>
                        <td className="p-2">{logo.colors}</td>
                        <td className="p-2 text-right">${logo.pricePerUnit.toFixed(2)}</td>
                        <td className="p-2 text-right">${logo.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-semibold">Subtotal Productos:</span>
              <span>${quotationDetails.baseTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="font-semibold">Subtotal Logos:</span>
              <span>${quotationDetails.logoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-blue-800">
              <span>TOTAL:</span>
              <span>${quotationDetails.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700"
              onClick={confirmQuotation}
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      )}

      {/* Mini Inventario */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3 text-blue-700">Inventario Actual (Local)</h2>
        {inventory.length > 0 ? (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left font-semibold">No.</th>
                  <th className="p-2 text-left font-semibold">Tipo</th>
                  <th className="p-2 text-left font-semibold">Fabricante</th>
                  <th className="p-2 text-left font-semibold">Producto</th>
                  <th className="p-2 text-left font-semibold">N° Prod.</th>
                  <th className="p-2 text-left font-semibold">Color</th>
                  <th className="p-2 text-left font-semibold">Tamaño</th>
                  <th className="p-2 text-right font-semibold">Cantidad</th>
                  <th className="p-2 text-right font-semibold">Costo</th>
                  <th className="p-2 text-right font-semibold">Precio</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr key={`${item.no}-${item.productNumber}-${index}`} className="border-t hover:bg-gray-50">
                    <td className="p-2">{item.no}</td>
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.manufacturer}</td>
                    <td className="p-2">{item.item}</td>
                    <td className="p-2">{item.productNumber}</td>
                    <td className="p-2">{item.color}</td>
                    <td className="p-2">{item.size}</td>
                    <td className={`p-2 text-right ${item.quantity === 0 ? 'text-red-500 font-bold' : ''}`}>{item.quantity}</td>
                    <td className="p-2 text-right">${item.cost.toFixed(2)}</td>
                    <td className="p-2 text-right">${item.sellingPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay datos de inventario para mostrar.</p>
        )}
      </div>
    </div>
  );
}