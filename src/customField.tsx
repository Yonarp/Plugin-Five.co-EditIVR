//@ts-nocheck
import { ThemeProvider } from "@mui/system";
import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Container,
  Autocomplete,
  CircularProgress,
  Select,
  Menu,
  MenuItem,
  ListItemButton,
} from "@mui/material"; 

import { DialogActions, FiveInitialize, FormControl, InputLabel, List } from "./FivePluginApi"; // Ensure the correct import path for FiveInitialize
import {
  CompanyNames,
  iCodes,
  lCodes,
  eCodes,
  mohsCodes,
  productsList,
} from "./strings";
import { CustomFieldProps } from "../../../common";

FiveInitialize();

const CustomField = (props: CustomFieldProps) => {
  const { theme, value, onValueUpdated, variant, five, selectedRecord } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [admitted, setAdmitted] = useState(null);
  const [placeOfService, setPlaceOfService] = useState(null);
  const [ivr, setIVR] = useState({});
  const [payors, setPayors] = useState([]);
  const [products, setProducts] = useState([]);
  const [practitioner, setPractitioner] = useState(null);
  const [practitionerList, setPractitionerList] = useState([]);
  const [iCode, setICode] = useState(null);
  const [lCode, setLCode] = useState(null);
  const [eCode, setECode] = useState(null);
  const [cdCode, setCDCode] = useState(null);
  const [cptCode, setCPTCode] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [cptWound, setCPTWound] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedCompanySecond, setSelectedCompanySecond] = useState("");
  const [primaryMemberNumber, setPrimaryMemberNumber] = useState("");
  const [secondaryMemberNumber, setSecondaryMemberNumber] = useState("");
  const [primaryGroupNumber, setPrimaryGroupNumber] = useState("");
  const [secondaryGroupNumber, setSecondaryGroupNumber] = useState();
  const [documents, setDocuments] = useState([]);
  const [secondDialogOpen, setSecondDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFilesBase64, setSelectedFilesBase64] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentType, setDocumentType] = useState("");
  const [otherDocumentType, setOtherDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("")
  const [documentNames, setDocumentNames] = useState([])
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)

  const handlePatient = useCallback((patientData, index = null) => {
    setPatient({ data: patientData, index: index });
  }, []);

  const handleSecondDialogOpen = (document) => {
    setSelectedDocument(document);
    setSecondDialogOpen(true);
  };

  const handleSecondDialogClose = () => {
    setSecondDialogOpen(false);
  };
  const handleDocumentDialogOpen = () => {
    setDocumentDialogOpen(true);
  };

  const handleDocumentDialogClose = () => {
    setDocumentDialogOpen(false);
  };

  
  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
    if (event.target.value !== "other") {
      setOtherDocumentType("");
    }
  };


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    // Convert files to base64 strings
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFilesBase64((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles((prev) => [...prev, ...files]);
    setDocumentTypes((prev) => [
      ...prev,
      documentType === "other" ? otherDocumentType : documentType,
    ]);
    
    setDocumentNames((prev) => [...prev, documentName]);
    setDocuments((prev) => [...prev, {
      Base64: files,
      Category: documentType === "other" ? otherDocumentType : documentType,
      Name: documentName

    } ])

    handleSecondDialogClose();
  };

  const getDataUri = (base64) => {
    if (base64.startsWith("data:image/")) {
      return base64;
    } else {
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const handleButtonClick = () => {
    const fetchData = async () => {
      await five.executeFunction(
        "getIVRDetails",
        selectedRecord.data,
        null,
        null,
        null,
        async (result) => {
          const data = JSON.parse(result.serverResponse.results);
          const ivr = data.ivr;
          setIVR(data);
          handlePatient(data?.patient);
          setLCode(ivr?.ICD10_L);
          setICode(ivr?.ICD10_I);
          setCPTCode(ivr?.CPTCODE);
          setECode(ivr?.ICD10_E);
          setDocuments(data.document);

          setProducts(() => {
            return productsList.find(
              (item) => data?.product.___PRD === item.PRD
            );
          });
          setPrimaryMemberNumber(data?.patient?.Pay1MemberNumber);
          setSecondaryMemberNumber(data?.patient?.Pay2MemberNumber);
          setPrimaryGroupNumber(data?.patient?.Pay1Group);
          setSecondaryGroupNumber(data?.patient?.Pay2Group);
          setCDCode(ivr?.ICD10_CD);
          setPractitioner(data?.practitioner);
          setCPTWound(ivr?.WoundType);

          setAdmitted(ivr?.SNFAttendance ? ivr?.SNFAttendance : false);
          setPlaceOfService(ivr?.PlaceofService);

          const payorKeys = [
            data?.patient?.__PAY1,
            data?.patient?.__PAY2,
          ].filter(Boolean);

          console.log("PAYOR KEYS FOR INSURANCE", payorKeys, data?.patient);

          const payorPromises = payorKeys.map((payorKey) => {
            const payorObject = { PayKey: payorKey };
            return new Promise((resolve) => {
              five.executeFunction(
                "getPatientInsurance",
                payorObject,
                null,
                null,
                null,
                (result) => {
                  const payorData = JSON.parse(result.serverResponse.results);
                  resolve(payorData.response.value[0]);
                }
              );
            });
          });

          const payorArray = await Promise.all(payorPromises);
          setPayors(payorArray);
          setSelectedCompany(payorArray[0]?.CompanyName);
          setSelectedCompanySecond(payorArray[1]?.CompanyName);

          await five.executeFunction(
            "getAccountPractitioners",
            {
              AccountKey: data?.account?.___ACT,
            },
            null,
            null,
            null,
            (result) => {
              const accountData = JSON.parse(result.serverResponse.results);
              setPractitionerList(
                accountData.filter((item) => item?.Title === "Practitioner")
              );
              setPractitioner(
                accountData.find(
                  (item) => item?.___USR === data?.practitioner.___USR
                )
              );
              setLoading(false);
            }
          );
        }
      );
    };

    setLoading(true);
    fetchData();
    setDialogOpen(true);
  };

  function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const handleSubmit = async (readyForSubmit) => {
    const IVR = {
      link: selectedRecord.data.editLink,
      patient: patient.data,
      products,
      practitionerKey: practitioner.___USR,
      eCode,
      admitted,
      placeOfService,
      payors,
      selectedCompany,
      selectedCompanySecond,
      iCode,
      lCode,
      primaryGroupNumber,
      primaryMemberNumber,
      secondaryGroupNumber,
      secondaryMemberNumber,
      cdCode,
      readyForSubmit,
      cptCode,
      Date: getFormattedDate(),
      cptWound,
    };
    console.log("Logging Documents");
    console.log(documents);
    console.log(IVR);
    await five.executeFunction(
      "updateIVR",
      //@ts-ignore
      IVR,
      null,
      null,
      null,
      (result) => {
        console.log(result);
      }
    );

    handleDialogClose();
  };

  const handleProductChange = (event) => {
    const newProduct = products;
    newProduct = event.target.value;

    setProducts(event.target.value);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleMemberNumber = (primary, event) => {
    if (primary) {
      setPrimaryMemberNumber(event.target.value);
    } else {
      setSecondaryMemberNumber(event.target.value);
    }
  };

  const handleGroupNumber = (primary, event) => {
    if (primary) {
      setPrimaryGroupNumber(event.target.value);
    } else {
      setSecondaryGroupNumber(event.target.value);
    }
  };

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleCompanyChange = (event, newValue) => {
    setSelectedCompany(newValue);
  };
  const handleCompanyChangeSecond = (event, newValue) => {
    setSelectedCompanySecond(newValue);
  };

  const handlePractitioner = (event) => {
    setPractitioner(event.target.value);
  };

  const handleICodeChange = (event, newValue) => {
    setICode(newValue);
  };

  const handleLCodeChange = (event, newValue) => {
    setLCode(newValue);
  };

  const handleECodeChange = (event, newValue) => {
    setECode(newValue);
  };

  const handleCDCodeChange = (event, newValue) => {
    setCDCode(newValue);
  };

  const handleCPTCodeChange = (event, newValue) => {
    setCPTCode(newValue);
  };

  if (loading) {
    return (
      <Container
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box>
      <Button
        fullWidth
        onClick={handleButtonClick}
        style={{
          background: "#266787",
          color: "white",
        }}
      >
        Open IVR
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          style: {
            width: "90%",
            height: "90%",
            padding: "20px",
          },
        }}
      >
        <DialogTitle style={{ backgroundColor: "#225D7A", color: "white" }}>
          IVR
        </DialogTitle>
        <DialogContent
          style={{ maxWidth: "100%", overflowX: "hidden", padding: "10px" }}
        >
          <Box
            sx={{
              p: 2,
              maxWidth: 600,
              mx: "auto",
              boxShadow: 3,
              borderRadius: 2,
            }}
            mt={10}
            mb={20}
          >
            <Typography variant="h6" gutterBottom>
              Insurance Verification Request
            </Typography>
            <Select
              fullWidth
              value={practitioner}
              onChange={handlePractitioner}
            >
              {practitionerList.map((practitioner) => (
                <MenuItem key={practitioner.___USR} value={practitioner}>
                  {practitioner.NameFull}
                </MenuItem>
              ))}
            </Select>
            <TextField label="NPI" fullWidth margin="dense" size="small" />

            <Select fullWidth value={products} onChange={handleProductChange}>
              {productsList.map((product) => (
                <MenuItem key={product?.QCode} value={product}>
                  {product?.Name}
                </MenuItem>
              ))}
            </Select>
            <Autocomplete
              options={[...CompanyNames, "Other"]}
              getOptionLabel={(option) => option}
              value={selectedCompany}
              onChange={handleCompanyChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Primary Payor"
                  margin="normal"
                  sx={{ minWidth: 200 }}
                />
              )}
            />

            <TextField
              label="Primary Member Number"
              fullWidth
              margin="dense"
              value={primaryMemberNumber}
              onChange={() => handleMemberNumber(true, event)}
              size="small"
            />
            <TextField
              label="Primary Group Number"
              fullWidth
              margin="dense"
              value={primaryGroupNumber}
              onChange={() => handleGroupNumber(true, event)}
              size="small"
            />

            <Autocomplete
              options={[...CompanyNames, "Other"]}
              getOptionLabel={(option) => option}
              value={selectedCompanySecond}
              onChange={handleCompanyChangeSecond}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Secondary Payor"
                  margin="normal"
                  sx={{ minWidth: 200 }}
                />
              )}
            />
            <TextField
              label="Secondary Member Number"
              fullWidth
              margin="dense"
              value={secondaryMemberNumber}
              onChange={() => handleMemberNumber(false, event)}
              size="small"
            />
            <TextField
              label="Secondary Group Number"
              fullWidth
              margin="dense"
              value={secondaryGroupNumber}
              onChange={() => handleGroupNumber(false, event)}
              size="small"
            />
            <Grid container spacing={1} marginTop={1}>
              {products && products.length > 0 && products[0]?.name && (
                <Grid item xs={6}>
                  <Typography variant="body1">Product 1</Typography>
                  <Typography variant="body2">{products[0].name}</Typography>
                </Grid>
              )}
              {products && products.length > 1 && products[1]?.name && (
                <Grid item xs={6}>
                  <Typography variant="body1">Product 2</Typography>
                  <Typography variant="body2">{products[1].name}</Typography>
                </Grid>
              )}
            </Grid>
            <Typography variant="h6" mt={3}>
              Codes:
            </Typography>
            <Grid container spacing={2} marginTop={1}>
              <Grid item xs={3}>
                <Autocomplete
                  options={iCodes}
                  getOptionLabel={(option) => option}
                  value={iCode}
                  onChange={handleICodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="I Code"
                      margin="normal"
                      // Adjust the width here
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Autocomplete
                  options={lCodes}
                  getOptionLabel={(option) => option}
                  value={lCode}
                  onChange={handleLCodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="L Code"
                      margin="normal"
                      // Adjust the width here
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Autocomplete
                  options={eCodes}
                  getOptionLabel={(option) => option}
                  value={eCode}
                  onChange={handleECodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="E Code"
                      margin="normal"
                      // Adjust the width here
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Autocomplete
                  options={mohsCodes}
                  getOptionLabel={(option) => option}
                  value={cdCode}
                  onChange={handleCDCodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CD Code"
                      margin="normal"
                      // Adjust the width here
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Autocomplete
                  options={mohsCodes}
                  getOptionLabel={(option) => option}
                  value={cptCode}
                  onChange={handleCPTCodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CPT Code"
                      margin="normal"
                      // Adjust the width here
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Typography variant="h6" mt={3}>
              Documents:
            </Typography>
            {documents.length > 0 ? (
              <List>
                {
                  //@ts-ignore
                  documents?.map((item, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSecondDialogOpen(item)}
                      sx={{
                        borderBottom: "1px solid #00000033",
                        color: "black",
                        "&:hover": {
                          backgroundColor: "lightblue",
                        },
                      }}
                    >
                      <Typography variant="body1">{item?.Name}</Typography>
                    </ListItemButton>
                  ))
                }
              </List>
            ) : (
              <Typography variant="body2" mt={3}>
                No Documents Added
              </Typography>
            )}
            <Button
            onClick={handleDocumentDialogOpen}
              style={{
                width: "150px",
                height: "50px",
                borderRadius: "0px",
                background: "#285C79",
                color: "white",
                marginRight: "20px",
              }}
            >
              {" "}
              Add Documents{" "}
            </Button>
            <Box display="flex" flexDirection="column">
              <Typography variant="h6" mt={3} mb={3}>
                Reasons:
              </Typography>

              <TextField
                rows={3}
                multiline
                fullWidth
                placeholder="Reasons"
                margin="10"
              />

              <Typography variant="h6" mt={3} mb={3}>
                Comments:
              </Typography>

              <TextField
                rows={3}
                multiline
                fullWidth
                placeholder="Comments"
                margin="10"
              />
            </Box>
            <Box
              style={{
                position: "absolute",
                bottom: "1%",
                width: "50%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                padding: 5,
                zIndex: 99,
              }}
            >
              <Button
                onClick={handleDialogClose}
                style={{
                  width: "100px",
                  height: "50px",
                  borderRadius: "0px",
                  background: "#285C79",
                  color: "white",
                  marginRight: "20px",
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => handleSubmit(null)}
                style={{
                  width: "100px",
                  height: "50px",
                  borderRadius: "0px",
                  background: "#285C79",
                  color: "white",
                  marginRight: "20px",
                }}
              >
                Save
              </Button>
              <Button
                onClick={() => handleSubmit(1)}
                style={{
                  width: "100px",
                  height: "50px",
                  borderRadius: "0px",
                  background: "#285C79",
                  color: "white",
                  marginRight: "20px",
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>

          {/* --------------------------------- Previewing Documents Dialog------------------------------- */}
          <Dialog
            open={secondDialogOpen}
            onClose={handleSecondDialogClose}
            PaperProps={{
              style: {
                minWidth: "70vw",
                height: "90%", // Sets the dialog to 90% of the screen width
              },
            }}
          >
            <DialogTitle>Document</DialogTitle>
            <DialogContent style={{ width: "100%", height: "100%" }}>
              {selectedDocument && selectedDocument.Base64 && (
                <img
                  src={getDataUri(selectedDocument.Base64)}
                  alt="Document"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSecondDialogClose} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* -------------------------- Adding Documents Dialog Box ----------------------------------- */}
          <Dialog open={documentDialogOpen} onClose={handleDocumentDialogClose}>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent style={{ width: "400px" }}>
              {/* Fixed width for dialog content */}
                <TextField
                    fullWidth
                    margin="normal"
                    label="Set Document Name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
              <FormControl fullWidth margin="normal">
                <InputLabel id="document-type-label">Document Type</InputLabel>
                <Select
                  labelId="document-type-label"
                  value={documentType}
                  onChange={handleDocumentTypeChange}
                  label="Document Type"
                >
                  <MenuItem value="facesheet">Facesheet</MenuItem>
                  <MenuItem value="wound notes">Wound Notes</MenuItem>
                  <MenuItem value="identification">Identification</MenuItem>
                  <MenuItem value="priorAuthorization">
                    Prior Authorization
                  </MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              {documentType === "other" && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Specify Document Type"
                  value={otherDocumentType}
                  onChange={(e) => setOtherDocumentType(e.target.value)}
                />
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDocumentDialogClose} color="primary">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomField;
