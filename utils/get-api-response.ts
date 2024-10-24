export interface GetAPIResponseProps {
  basePath: string
  apiPath: string
  token?: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  addMultipartHeader?: boolean
  /**
   * `revalidationTime` is the time in seconds for caching the data that is fetched from the API.
   */
  revalidationTime?: number
}

export const getAPIResponse = async ({
  basePath,
  apiPath,
  token = "",
  method = "GET",
  body = null,
  addMultipartHeader = false,
  revalidationTime = 0,
}: GetAPIResponseProps) => {
  const requestInit: RequestInit = {
    method: method,
    headers: {
      Authorization: token,
      "server-token": process.env.SERVER_TOKEN as string,
      "Access-Control-Allow-Origin": "*",
      // "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Content-Type": body && addMultipartHeader ? "multipart/form-data" : "application/json",
    },
    body: body != null ? body : null,
    cache: revalidationTime == 0 ? "no-store" : "default",
    next: {
      revalidate: revalidationTime,
    },
  }

  console.log("requestInit", requestInit, "path", basePath + apiPath)

  try {
    // + fetch data from the API
    const response = await fetch(basePath + apiPath, requestInit)

    // * if the response status is not 200, throw an error
    if (response.status != 200) {
      throw Error(response.statusText, {
        // pass the status code as the cause of the error
        cause: response.status,
      })
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching data: ", error)
    return {
      status: (error as Error).cause, // java style
      status_code: (error as Error).cause, // laravel style
      error: (error as Error).message, // kept in sync with the `responseHandler` fn
      stack: (error as Error).stack,
    }
  }
}
