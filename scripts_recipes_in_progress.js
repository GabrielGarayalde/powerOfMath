function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10);
}



var callAPIPOSTRecipeDB = async (
  unique_id,
  name,
  link
) => {
  try {
    var requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID: unique_id,
        name: name,
        link: link,
      }),
    };

    const dbResponse = await fetch(
      "https://0z23n5kl0l.execute-api.eu-north-1.amazonaws.com/prod/Recipe",
      requestOptions
    );
    const dbResult = await dbResponse.text();

    if (!dbResponse.ok) {
      throw new Error("DB update failed");
    }

    console.log("DB update successful");
    console.log(dbResult);
    return dbResult;
  } catch (error) {
    console.error("Error updating DB:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

var callAPIToFetchEntries = async () => {
  try {
    const response = await fetch(
      `https://0z23n5kl0l.execute-api.eu-north-1.amazonaws.com/prod/Recipes`,
      {
        method: "GET",
        headers: {
          // Include headers if required, e.g., Authorization
          'Content-Type': 'application/json'
          // 'Authorization': 'Bearer YOUR_API_KEY_HERE'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok (${response.status})`);
    }

    const data = await response.json();
    console.log("Fetched Data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching entries:", error);
    throw error; // Rethrow to handle this error further up in your code
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


// Function to call API to delete an entry
// var callAPIToDeleteEntry = async (ID) => {
//   try {
//     const response = await fetch(
//       `https://0z23n5kl0l.execute-api.eu-north-1.amazonaws.com/prod/Recipe?ID=${ID}`,
//       {
//         method: "DELETE",
//       }
//     );

//     console.log(response, "API Response for deletion"); // Detailed log

//     if (!response.ok) {
//       throw new Error(`Delete failed with status: ${response.status}`);
//     }

//     return response.json(); // Assume API sends some JSON response you might need
//   } catch (error) {
//     console.error("Error deleting entry from API:", error);
//     throw error; // Rethrow to handle it in the calling function
//   }
// };

