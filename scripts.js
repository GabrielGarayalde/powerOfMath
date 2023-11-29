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
  fetch(
    `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${RecipeID}`,
    {
      method: "GET",
    }
  )
    .then((response) => response.text())
    .then((result) => displayItem(JSON.parse(data)))
    .catch((error) => console.log("error", error));
};

var callAPIGETRecipes = () => {
  // make API call with parameters and use promises to get response
  fetch(
    "https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipes",
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((result) => displayDynamoDBItems(result)) // console.log(result)) //
    .catch((error) => console.log("error", error));
};

// Function to display DynamoDB items on the webpage
var displayDynamoDBItems = (data) => {
  // data = JSON.parse(data);
  var resultsElement = document.querySelector(".results");
  resultsElement.innerHTML = "";

  for (const item of data) {
    // console.log(item);
    displayItem(item);
  }
};

var displayItem = (item) => {
  var resultsElement = document.querySelector(".results");

  // Modify the card template to include an image
  resultsElement.innerHTML += `<div class="card">
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
        <button type="button" onclick="editItem('${item.ID}', '${item.name}', '${item.ingredients}', '${item.instructions}')">Edit</button>
        <button type="button" onclick="deleteItem('${item.ID}')">Delete</button>
    </div>
</div>`;
};

var editItem = (id, name, ingredients, instructions) => {
  // Populate form fields for editing
  document.getElementById("editingId").value = id;
  document.getElementById("name").value = name;
  document.getElementById("ingredients").value = ingredients;
  document.getElementById("instructions").value = instructions;

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
      .then((result) => callAPIGETRecipes())
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
var handleFormSubmit = () => {
  if (document.getElementById("editingId").value) {
    console.log(document.getElementById("editingId").value);
    callAPIPATCHRecipe();
  } else {
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
};

var deleteItem = (name) => {
  fetch(
    `https://ne26igktsj.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${name}`,
    {
      method: "DELETE",
    }
  )
    .then((response) => {
        console.log(response, "recipe deleted")
      if (response.ok) {
        callAPIGETRecipes(); // Refresh the list
      } else {
        console.error("Delete failed", response.status);
      }
    })
    .catch((error) => console.error("Error:", error));
};


