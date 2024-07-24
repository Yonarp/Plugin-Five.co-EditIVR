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
} from "@mui/material"; // Ensure you have these imports correctly

import { FiveInitialize } from "./FivePluginApi"; // Ensure the correct import path for FiveInitialize
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
  const [primaryMemberNumber, setPrimaryMemberNumber] = useState("")
  const [secondaryMemberNumber, setSecondaryMemberNumber] = useState("")
  const [primaryGroupNumber, setPrimaryGroupNumber] = useState("")
  const [secondaryGroupNumber, setSecondaryGroupNumber] = useState()

  const handlePatient = useCallback((patientData, index = null) => {
    setPatient({ data: patientData, index: index });
  }, []);

  const handlePractitioner = useCallback((practitionerData, index = null) => {
    setPractitioner({ data: practitionerData, index: index });
  }, []);

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

          setProducts(() => {
            return productsList.find(
              (item) => data?.product.___PRD === item.PRD
            );
          });
          setPrimaryMemberNumber(data?.patient?.Pay1MemberNumber)
          setSecondaryMemberNumber(data?.patient?.Pay2MemberNumber)
          setPrimaryGroupNumber(data?.patient?.Pay1Group)
          setSecondaryGroupNumber(data?.patient?.Pay2Group)
          setCDCode(ivr?.ICD10_CD);
          handlePractitioner(data?.practitioner);
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
          setLoading(false);
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
      practitioner,
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
    console.log("Selected Records Logging")
     console.log(selectedRecord.data);
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
    
    handleDialogClose()
  }

  const handleProductChange = (event) => {
    const newProduct = products;
    newProduct = event.target.value;

    setProducts(event.target.value);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleMemberNumber = (primary, event) => {
    if(primary){
      setPrimaryMemberNumber(event.target.value)
    } else {
      setSecondaryMemberNumber(event.target.value)
    }
  }

  const handleGroupNumber = (primary, event) => {
    if(primary) {
      setPrimaryGroupNumber(event.target.value)
    }
    else {
      setSecondaryGroupNumber(event.target.value)
    }
  }

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleCompanyChange = (event, newValue) => {
    setSelectedCompany(newValue);
  };
  const handleCompanyChangeSecond = (event, newValue) => {
    setSelectedCompanySecond(newValue);
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
  console.log("Data", ivr);
  console.log("products", products);
  console.log("Payors", payors);
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
            <TextField
              label="Practitioner"
              fullWidth
              margin="dense"
              value={practitioner ? practitioner.data.NameFull : ""}
              size="small"
            />
            <TextField
              label="NPI"
              fullWidth
              margin="dense"
              value={practitioner ? practitioner.data.NPI : ""}
              size="small"
            />

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
                    width:'100px',
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
                    width:'100px',
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
                    width:'100px',
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
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomField;
