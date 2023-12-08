function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10);
}

var callAPIPOSTRecipe = async (file, name, ingredients, instructions) => {
  let unique_id = generateUniqueId();

  // First, upload the image to S3
  try {
    const binaryData = await readFileAsArrayBuffer(file);
    const imageUploadResponse = await fetch(
      `https://c9fuffy6cg.execute-api.eu-north-1.amazonaws.com/prod/recipe-bucket-anna?ID=${encodeURIComponent(
        unique_id
      )}.jpg`,
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

  // Then, post the recipe data to DynamoDB
  try {
    var requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID: unique_id,
        name: name,
        ingredients: ingredients,
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
  console.log("result: ", recipes);
  localStorage.setItem("recipes", JSON.stringify(recipes));
}

// Function to retrieve recipes from local storage
function getRecipesFromCache() {
  const storedData = localStorage.getItem("recipes");
  return (recipes = storedData ? JSON.parse(storedData) : []);
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

  for (const item of data) {
    // console.log(item);
    displayCardItem(item);
  }
};

var displayCardItem = (item) => {
  var resultsElement = document.querySelector(".results");

  // Wrap the card content in an anchor tag
  resultsElement.innerHTML += `<a href="display_recipe.html?id=${item.ID}"  class="card-link">
    <div class="card" data-id="${item.ID}">

      <div class="image-container">
        <img src="data:image/jpeg;base64,${item.image}" alt="${item.name}" class="square-image">
      </div>

      <div class="card-header">
        <div class="card-title">
          <h3>${item.name}</h3>
        </div>
        <div class="card-actions">
          <a href="edit_recipe.html?id=${item.ID}"><button type="button">Edit</button></a>
          <button id="deleteButton" type="button">Delete</button>
        </div>
      </div>

    </div>

    </a>`;
};

var displayEditItem = (result) => {
  // Populate form fields for editing
  document.getElementById("editingId").value = result.ID;
  document.getElementById("name").value = result.name;
  document.getElementById("ingredients").value = result.ingredients;
  document.getElementById("instructions").value = result.instructions;

  // Show the Cancel Edit button
  document.getElementById("cancelEditButton").style.display = "block";
};

var callAPIPATCHRecipe = () => {
  var id = document.getElementById("editingId").value;
  var name = document.getElementById("name").value;
  var ingredients = document.getElementById("ingredients").value;
  var instructions = document.getElementById("instructions").value;

  let fileInput = document.getElementById("fileInput");
  let file = fileInput.files.length > 0 ? fileInput.files[0] : null;

  var updateRecipeData = () => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var request = {
      name: name,
      ingredients: ingredients,
      instructions: instructions,
    };

    var requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: JSON.stringify(request),
      redirect: "follow",
    };

    fetch(
      `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${id}`,
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => alert("recipe patched succesfully!"))
      .catch((error) => console.log("error", error));
  };

  if (file) {
    // If a file is selected, upload it first
    const reader = new FileReader();
    reader.onload = function (event) {
      const binaryData = event.target.result;
      fetch(
        `https://c9fuffy6cg.execute-api.eu-north-1.amazonaws.com/prod/recipe-bucket-anna?ID=${encodeURIComponent(
          id
        )}.jpg`,
        {
          method: "POST",
          body: binaryData, // Send the binary data directly
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.text();
        })
        .then((data) => {
          console.log("Image upload successful:", data);
          updateRecipeData(); // Update the recipe data after image upload
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
          updateRecipeData(); // Update the recipe data even if image upload fails
        });
    };
    reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
  } else {
    // If no file is selected, update the recipe data directly
    updateRecipeData();
  }
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
    default:
    // No sorting or default sorting logic if needed
  }
  displayDynamoDBItems(recipes);
}


function toggleDropdownMenu() {
  var dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
}
