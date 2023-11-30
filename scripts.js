function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10);
}

// callAPI function that takes the base and exponent numbers as parameters
var callAPIPOSTRecipe = (file, name, ingredients, instructions) => {
  // GENERATE A UNIQUE ID IDENTIFIER FOR THE RECIPE TEXT AND IMAGE
  let unique_id = generateUniqueId();

  // FIRST WE DO A POST REQUEST TO THE DYNAMO DB TABLE
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var request = {
    ID: unique_id,
    name: name,
    ingredients: ingredients,
    instructions: instructions,
  };
  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(request),
    redirect: "follow",
  };
  fetch(
    "https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe",
    requestOptions
  )
    .then((response) => response.text())
    // .then((result) => callAPIGETRecipes())
    .catch((error) => console.log("error", error));
  // THEN WE DO A POST REQUEST TO THE S3 BUCKET
  const reader = new FileReader();
  reader.onload = function (event) {
    const binaryData = event.target.result;
    fetch(
      `https://c9fuffy6cg.execute-api.eu-north-1.amazonaws.com/prod/recipe-bucket-anna?ID=${encodeURIComponent(
        unique_id
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
      })
      //   .then((result) => callAPIGETRecipes())
      .catch((error) => console.error("Error uploading image:", error));
  };
  reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
};

var callAPIGETRecipe = (RecipeID) => {
  return fetch(
    `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${RecipeID}`,
    {
      method: "GET",
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text(); // Make sure to return the response text here
    })
    .then((result) => {
      return JSON.parse(result);
    })
    .catch((error) => {
      console.log("error", error);
      throw error;
    });
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
var callAPIGETRecipes = () => {
  const cachedRecipes = getRecipesFromCache();
  console.log("result: ", cachedRecipes);

  if (cachedRecipes) {
    console.log("cached recipes used");
    displayDynamoDBItems(cachedRecipes); // Replace this with your function to display recipes
  }

  fetch(
    "https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipes",
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((result) => {
      storeRecipesInCache(result);
      displayDynamoDBItems(result);
    })
    .catch((error) => console.log("error", error));
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
  resultsElement.innerHTML += `<a href="display_recipe.html?id=${item.ID}" class="card-link">
    <div class="card">
        <div class="card-header">${item.name}</div>
        <div class="image-container">
            <img src="data:image/jpeg;base64,${item.image}" alt="${item.name}" class="square-image">
        </div>
        <div>
            <p>Ingredients: ${item.ingredients}</p>
            <p>Instructions: ${item.instructions}</p>
            <p>Created: ${item.created}</p>
            </div>
        <div class="card-actions">
            <a href="edit_recipe.html?id=${item.ID}"><button type="button">Edit</button></a>
            <button type="button" onclick="event.stopPropagation(); deleteItem('${item.ID}');">Delete</button>
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

// Modify the button in the form to handle both post and patch
var EditRecipeSubmit = () => {
  callAPIPATCHRecipe();
  cancelEdit(); // This function already does the required clearing and hiding
};

// Modify the button in the form to handle both post and patch
var CreateRecipeSubmit = () => {
  let file;
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length > 0) {
    file = fileInput.files[0];
    callAPIPOSTRecipe(
      file,
      document.getElementById("name").value,
      document.getElementById("ingredients").value,
      document.getElementById("instructions").value
    );
  } else {
    alert("Please select an image file to upload.");
  }

  // Clear form fields and hide the Cancel Edit button after submission
  cancelEdit(); // This function already does the required clearing and hiding
};

var cancelEdit = () => {
  // Clearing the form fields
  document.getElementById("editingId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("ingredients").value = "";
  document.getElementById("instructions").value = "";
  // Hide the Cancel Edit button
  document.getElementById("cancelEditButton").style.display = "none";

  window.location.href = "/"; // Update this URL to your homepage URL if it's different
};

var deleteItem = (name) => {
  fetch(
    `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${name}`,
    {
      method: "DELETE",
    }
  )
    .then((response) => {
      console.log(response, "recipe deleted");
      if (response.ok) {
        callAPIGETRecipes(); // Refresh the list
      } else {
        console.error("Delete failed", response.status);
      }
    })
    .catch((error) => console.error("Error:", error));
};
