function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10);
}

var callAPIPOSTRecipeImage = async (unique_id, file) => {
  try {
    const binaryData = await readFileAsArrayBuffer(file);
    const imageUploadResponse = await fetch(
      `https://c9fuffy6cg.execute-api.eu-north-1.amazonaws.com/prod/recipe-bucket-anna?ID=${encodeURIComponent(
        unique_id
      )}`,
      {
        method: "POST",
        body: binaryData,
      }
    );

    console.log(binaryData);
    if (!imageUploadResponse.ok) {
      throw new Error("Image upload failed");
    }

    console.log("Image upload successful");
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

var callAPIPOSTRecipeDB = async (
  unique_id,
  name,
  ingredients,
  quote,
  instructions
) => {
  try {
    var requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID: unique_id,
        name: name,
        ingredients: ingredients,
        quote: quote,
        instructions: instructions,
      }),
    };

    const dbResponse = await fetch(
      "https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe",
      requestOptions
    );
    const dbResult = await dbResponse.text();

    if (!dbResponse.ok) {
      throw new Error("DB update failed");
    }

    console.log("DB update successful");
    return dbResult;
  } catch (error) {
    console.error("Error updating DB:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

// Helper function to read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

var callAPIGETRecipe = async (RecipeID) => {
  try {
    const response = await fetch(
      `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${RecipeID}`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const result_1 = await response.text();
    return JSON.parse(result_1);
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

// Function to store recipes in local storage
function storeRecipesInCache(recipes) {
  localStorage.setItem("recipes", JSON.stringify(recipes));
}

// Function to retrieve recipes from local storage
function getRecipesFromCache() {
  const storedData = localStorage.getItem("recipes");
  try {
    const parsedData = storedData ? JSON.parse(storedData) : [];
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else {
      console.error("Cache is not an array. Please clear the cache manually.");
      return [];
    }
  } catch (error) {
    console.error("Failed to parse cached recipes:", error);
    return [];
  }
}

// Modified callAPIGETRecipes to use caching
var callAPIGETRecipes = async () => {
  try {
    const response = await fetch(
      "https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipes",
      {
        method: "GET",
      }
    );
    const result_1 = await response.json();
    console.log("result: ", result_1);

    storeRecipesInCache(result_1);
    return result_1;
  } catch (error) {
    return console.log("error", error);
  }
};

// Function to display DynamoDB items on the webpage
var displayDynamoDBItems = (data) => {
  // data = JSON.parse(data);
  var resultsElement = document.querySelector(".results");
  resultsElement.innerHTML = "";
  console.log("data: ", data);
  for (const item of data) {
    if (item.ID !== "secret_recipe") {
      displayCardItem(item);
    }
  }
};

var displayCardItem = (item) => {
  var resultsElement = document.querySelector(".results");

  var likeState = item.like == "true" ? "fa-solid" : "fa-regular";

  // Wrap the card content in an anchor tag
  resultsElement.innerHTML += `<a href="display_recipe.html?id=${item.ID}"  class="card-link">
    <div class="card" data-id="${item.ID}">

      <div class="image-container">
        <img src="data:image/jpeg;base64,${item.image1}" alt="${item.name}" class="square-image">
      </div>

      <div class="card-header">
        <div class="card-title">
          <h3>${item.name}</h3>
        </div>
        </a>
        <div class="card-actions">
          <i class=" like-button fa-heart ${likeState}" "></i>
          <a href="edit_recipe.html?id=${item.ID}"><button type="button">Edit</button></a>
          <button id="deleteButton" type="button">Delete</button>

        </div>
      </div>

    </div>
    `;
};

var displayEditItem = (result) => {
  // Populate form fields for editing
  document.getElementById("editingId").value = result.ID;
  document.getElementById("name").value = result.name;
  document.getElementById("quote").value = result.quote;
  document.getElementById("instructions").value = result.instructions;

  console.log("result: ", result.ingredients);
  // Parse ingredients and fill in ingredient and quantity elements
  var ingredients = result.ingredients.split(",");
  var ingredientList = document.getElementById("ingredient-list");

  console.log("ingredients: ", ingredients);
  for (const ingredient of ingredients) {
    var [name, quantity] = ingredient.split(":");

    // Create div element for ingredient row
    var ingredientRow = document.createElement("div");
    ingredientRow.className = "ingredient-row";

    // Create form elements for name and quantity
    var nameInput = document.createElement("input");
    nameInput.classList = "ingredient-name";
    nameInput.type = "text";
    nameInput.name = "ingredient-name";
    nameInput.value = name.trim();
    ingredientRow.appendChild(nameInput);

    var quantityInput = document.createElement("input");
    quantityInput.classList = "ingredient-quantity";
    quantityInput.type = "text";
    quantityInput.name = "ingredient-quantity";
    quantityInput.value = quantity.trim();
    ingredientRow.appendChild(quantityInput);

    ingredientList.appendChild(ingredientRow);
  }
};

var callAPIPATCHRecipeDB = async (
  id,
  name,
  ingredients,
  quote,
  instructions
) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var request = {
    name: name,
    ingredients: ingredients,
    quote: quote,
    instructions: instructions,
  };

  var requestOptions = {
    method: "PATCH",
    headers: myHeaders,
    body: JSON.stringify(request),
    redirect: "follow",
  };

  try {
    const response = await fetch(
      `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${id}`,
      requestOptions
    );
    const result = await response.text();
    alert("recipe patched successfully!");
  } catch (error) {
    console.log("error", error);
  }
};

var callAPIPATCHLike = async (id, state) => {
  // Make PATCH request to update like state
  fetch(
    `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Like?ID=${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ like: state }),
    }
  )
    .then((response) => {
      if (response.ok) {
        console.log("Like state updated successfully");
      } else {
        console.error("Failed to update like state");
      }
    })
    .catch((error) => {
      console.error("Error updating like state:", error);
    });
};

var cancelEdit = () => {
  // Clearing the form fields
  document.getElementById("editingId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("ingredients").value = "";
  document.getElementById("instructions").value = "";

  window.location.href = "/"; // Update this URL to your homepage URL if it's different
};

var deleteItem = async (name) => {
  try {
    const response = await fetch(
      `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${name}`,
      {
        method: "DELETE",
      }
    );

    console.log(response, "recipe deleted");

    if (response.ok) {
      // Refresh the list
      const updatedRecipes = await callAPIGETRecipes();
      // Assuming you have a function to update the display with the new list
      displayDynamoDBItems(updatedRecipes);
    } else {
      console.error("Delete failed", response.status);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function to sort recipes based on selected option
function sortRecipes(sortOption) {
  const cachedRecipes = getRecipesFromCache();
  // const cachedRecipes = callAPIGETRecipes();
  console.log(sortOption);
  switch (sortOption) {
    case "name-asc":
      cachedRecipes.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      cachedRecipes.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "date-recent-first":
      // Assuming you have a 'created' property in your recipe objects
      cachedRecipes.sort((a, b) => new Date(b.created) - new Date(a.created));
      break;
    case "date-oldest-first":
      // Assuming you have a 'created' property in your recipe objects
      cachedRecipes.sort((a, b) => new Date(a.created) - new Date(b.created));
      break;
    case "like-first":
      cachedRecipes.sort((a, b) => {
        // Convert string values to boolean for comparison
        const aLiked = a.like === "true";
        const bLiked = b.like === "true";

        if (aLiked && !bLiked) {
          return -1;
        } else if (!aLiked && bLiked) {
          return 1;
        } else {
          // Optionally, sort by name if both have likes or neither have likes
          return a.name.localeCompare(b.name);
        }
      });
      console.log(cachedRecipes);
      break;

    default:
  }

  displayDynamoDBItems(recipes);
}

function toggleDropdownMenu() {
  var dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.style.display =
    dropdownMenu.style.display === "block" ? "none" : "block";
}
