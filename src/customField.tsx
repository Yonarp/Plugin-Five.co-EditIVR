// @ts-nocheck
import { ThemeProvider } from "@mui/system";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Grid,
  Container,
  Autocomplete,
  CircularProgress,
  Select,
  MenuItem,
  ListItemButton,
  FormHelperText,
} from "@mui/material";

import {
  DialogActions,
  FiveInitialize,
  FormControl,
  InputLabel,
  List,
} from "./FivePluginApi"; // Ensure the correct import path for FiveInitialize
import {
  CompanyNames,
  iCodes,
  lCodes,
  eCodes,
  mohsCodes,
  productsList,
  cptCodes,
} from "./strings";
import { CustomFieldProps } from "../../../common";
import { Delete } from "@mui/icons-material";

FiveInitialize();

const CustomField = (props: CustomFieldProps) => {
  const { theme, value, onValueUpdated, variant, five, selectedRecord } = props;

  // -----------------------------------------------------
  // States
  // -----------------------------------------------------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [admitted, setAdmitted] = useState(null);
  const [placeOfService, setPlaceOfService] = useState(null);
  const [ivr, setIVR] = useState({});
  const [payors, setPayors] = useState([]);
  const [products, setProducts] = useState(null); // store a single product
  const [practitioner, setPractitioner] = useState(null);
  const [practitionerList, setPractitionerList] = useState([]);
  const [iCode, setICode] = useState("");
  const [lCode, setLCode] = useState("");
  const [eCode, setECode] = useState("");
  const [cdCode, setCDCode] = useState("");
  const [cptWoundSize1, setCPTWoundSize1] = useState("");
  const [cptWoundSize2, setCPTWoundSize2] = useState("");
  const [cptCode, setCPTCode] = useState("");
  const [cptCode2, setCPTCode2] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [cptWound, setCPTWound] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedCompanySecond, setSelectedCompanySecond] = useState("");
  const [primaryMemberNumber, setPrimaryMemberNumber] = useState("");
  const [secondaryMemberNumber, setSecondaryMemberNumber] = useState("");
  const [primaryGroupNumber, setPrimaryGroupNumber] = useState("");
  const [secondaryGroupNumber, setSecondaryGroupNumber] = useState("");
  const [documents, setDocuments] = useState([]);
  const [secondDialogOpen, setSecondDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFilesBase64, setSelectedFilesBase64] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentType, setDocumentType] = useState("");
  const [otherDocumentType, setOtherDocumentType] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentNames, setDocumentNames] = useState([]);
  const [npi, setNPI] = useState("");
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [reasons, setReasons] = useState("");
  const [isDeleting, setDeleting] = useState(false);
  const [dialogSelectedFiles, setDialogSelectedFiles] = useState([]);

  // Error state for document uploads
  const [errors, setErrors] = useState({
    documentName: false,
    documentType: false,
    otherDocumentType: false,
    selectedFiles: false,
  });

  // -----------------------------------------------------
  // Read-Only logic
  // -----------------------------------------------------
  const isReadOnly = status === "Approved" || status === "Archived";

  // -----------------------------------------------------
  // Helpers
  // -----------------------------------------------------
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

  const getFileExtension = (filename) => {
    const parts = filename.split(".");
    return parts[parts.length - 1];
  };

  const handleDocumentDialogOpen = () => {
    setDialogSelectedFiles([]);
    setDocumentName("");
    setDocumentType("");
    setOtherDocumentType("");
    setErrors({
      documentName: false,
      documentType: false,
      otherDocumentType: false,
      selectedFiles: false,
    });

    if (documents.length >= 5) {
      return five.message(
        "Cannot upload more than " + documents.length.toString() + " files."
      );
    }
    setDocumentDialogOpen(true);
  };

  const handleDocumentDialogClose = () => {
    setDocumentDialogOpen(false);
    setDialogSelectedFiles([]);
    setDocumentName("");
    setDocumentType("");
    setOtherDocumentType("");
    setErrors({
      documentName: false,
      documentType: false,
      otherDocumentType: false,
      selectedFiles: false,
    });
  };

  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
    if (event.target.value !== "other") {
      setOtherDocumentType("");
    }
    setErrors((prev) => ({ ...prev, documentType: false }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setDialogSelectedFiles(files);
    setErrors((prev) => ({ ...prev, selectedFiles: false }));
  };

  const handleDocumentDialogSubmit = () => {
    let hasError = false;
    const newErrors = {
      documentName: false,
      documentType: false,
      otherDocumentType: false,
      selectedFiles: false,
    };

    if (documentName.trim() === "") {
      newErrors.documentName = true;
      hasError = true;
    }

    if (documentType.trim() === "") {
      newErrors.documentType = true;
      hasError = true;
    }

    if (documentType === "other" && otherDocumentType.trim() === "") {
      newErrors.otherDocumentType = true;
      hasError = true;
    }

    if (dialogSelectedFiles.length === 0) {
      newErrors.selectedFiles = true;
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const promises = dialogSelectedFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    dialogSelectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileType = file.type;
        setSelectedFilesBase64((prev) => [
          ...prev,
          { Base64: reader.result, ContentType: fileType },
        ]);
      };
      reader.readAsDataURL(file);
    });

    Promise.all(promises)
      .then((base64Files) => {
        setSelectedFiles((prev) => [...prev, ...dialogSelectedFiles]);
        setSelectedFilesBase64((prev) => [...prev, ...base64Files]);
        setDocumentTypes((prev) => [
          ...prev,
          documentType === "other" ? otherDocumentType : documentType,
        ]);
        setDocumentNames((prev) => [...prev, documentName]);

        setDocuments((prev) => [
          ...prev,
          ...dialogSelectedFiles.map((file, index) => ({
            Base64: base64Files[index],
            Category:
              documentType === "other" ? otherDocumentType : documentType,
            Name: documentName + "." + getFileExtension(file.name),
          })),
        ]);

        handleDocumentDialogClose();

        const documentObject = {
          Base64: base64Files[0],
          DocumentName: documentName,
          Category: documentType === "other" ? otherDocumentType : documentType,
          PatientKey: patient.data.___PAT,
        };

        five.executeFunction(
          "pushDocument",
          //@ts-ignore
          documentObject,
          null,
          null,
          null,
          (result) => {
            // ...
          }
        );
      })
      .catch((error) => {
        console.error("Error reading files: ", error);
      });
  };

  const getMimeTypeFromDataUri = (dataUri) => {
    const mimeType = dataUri.match(/data:([^;]+);base64,/);
    return mimeType ? mimeType[1] : null;
  };

  const handleButtonClick = () => {
    const fetchData = async () => {
      setLoading(true);
      await five.executeFunction(
        "getIVRDetails",
        selectedRecord.data,
        null,
        null,
        null,
        async (result) => {
          const data = JSON.parse(result.serverResponse.results);
          const ivrData = data.ivr;
          setIVR(data);
          handlePatient(data?.patient);
          setLCode(ivrData?.ICD10_L || "");
          setICode(ivrData?.ICD10_I || "");
          setCPTCode(ivrData?.CPTCODE || "");
          setCPTCode2(ivrData?.CPTCODE2 || "");
          setCPTWoundSize1(ivrData?.WoundSize || "");
          setCPTWoundSize2(ivrData?.WoundSize2 || "");
          setECode(ivrData?.ICD10_E || "");
          setDocuments(data.document);
          setStatus(selectedRecord.data?.Status);

          // If there's a saved product in DB, find it in productsList
          const matchedProduct = productsList.find(
            (item) => data?.product?.___PRD === item?.PRD
          );
          setProducts(matchedProduct || null);

          setPrimaryMemberNumber(data?.patient?.Pay1MemberNumber || "");
          setSecondaryMemberNumber(data?.patient?.Pay2MemberNumber || "");
          setPrimaryGroupNumber(data?.patient?.Pay1Group || "");
          setSecondaryGroupNumber(data?.patient?.Pay2Group || "");
          setCDCode(ivrData?.ICD10_CD || "");
          setPractitioner(data?.practitioner);
          setCPTWound(ivrData?.WoundType);
          setAdmitted(ivrData?.SNFAttendance ? ivrData?.SNFAttendance : false);
          setPlaceOfService(ivrData?.PlaceofService);
          setComment(ivrData?.Comment);
          setReasons(ivrData?.Reason);

          const payorKeys = [data?.patient?.__PAY1, data?.patient?.__PAY2].filter(
            Boolean
          );
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
          setSelectedCompany(payorArray[0]?.CompanyName || "");
          setSelectedCompanySecond(payorArray[1]?.CompanyName || "");

          // If you want NPI to be editable, store it in state
          setNPI(data?.account?.NPI || "");

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
              const onlyPractitioners = accountData.filter(
                (item) => item?.Title === "Practitioner"
              );
              setPractitionerList(onlyPractitioners);

              // If there's an existing practitioner from the server, set it properly
              const matchedPractitioner = onlyPractitioners.find(
                (item) => item?.___USR === data?.practitioner?.___USR
              );
              setPractitioner(matchedPractitioner || null);
              setLoading(false);
            }
          );

          // Log something
          const logObject = {
            ivr: ivrData,
            ORD: "",
            type: "IVR",
          };

          await five.executeFunction(
            "TriggerOpenIVRLog",
            logObject,
            null,
            null,
            null,
            async (result) => {
              // ...
            }
          );
        }
      );
    };

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
      practitionerKey: practitioner?.___USR,
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
      cptWoundSize1,
      cptWoundSize2,
      cptCode2,
      reasons,
      comment,
      IVRKey: ivr.ivr?.___IVR,
    };

    await five.executeFunction(
      "updateIVR",
      //@ts-ignore
      IVR,
      null,
      null,
      null,
      (result) => {
        // ...
      }
    );

    handleDialogClose();
  };

  const handleProductChange = (event) => {
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

  const handleDeleteDocument = async (document, index) => {
    setDeleting(true);
    await five.executeFunction(
      "DeleteDocument",
      //@ts-ignore
      document,
      null,
      null,
      null,
      async (result) => {
        await five.executeFunction(
          "getIVRDetails",
          selectedRecord.data,
          null,
          null,
          null,
          async (result) => {
            // Update documents state with fresh data
            const data = JSON.parse(result.serverResponse.results);
            setDocuments(data.document);
            setDeleting(false);
          }
        );
      }
    );
  };

  // Update status from record on mount
  useEffect(() => {
    setStatus(selectedRecord.data?.Status);
  }, [selectedRecord.data?.Status]);

  // -----------------------------------------------------
  // VALIDATION FUNCTIONS
  // -----------------------------------------------------
  const isValidRequiredValue = (val) => {
    if (!val) return false;
    const strVal = String(val).trim().toLowerCase();
    if (!strVal || strVal === "null") return false;
    return true;
  };

  const isPositiveNumber = (val) => {
    if (!val) return false;
    const num = parseFloat(val);
    if (Number.isNaN(num)) return false;
    return num > 0;
  };

  // -----------------------------------------------------
  // Required Fields Validation (useMemo)
  // -----------------------------------------------------
  const isRequiredFieldMissing = useMemo(() => {
    // Practitioner must be chosen
    if (!practitioner || !practitioner.___USR) return true;

    // NPI must be present
    if (!isValidRequiredValue(ivr?.account?.NPI)) return true;

    // Product required
    if (!products) return true;

    // Primary Payor
    if (!isValidRequiredValue(selectedCompany)) return true;

    // Primary Member & Group required
    if (!isValidRequiredValue(primaryMemberNumber)) return true;
    if (!isValidRequiredValue(primaryGroupNumber)) return true;

    // At least one ICD code is required (iCode, lCode, eCode, cdCode)
    const iCodeValid = isValidRequiredValue(iCode);
    const lCodeValid = isValidRequiredValue(lCode);
    const eCodeValid = isValidRequiredValue(eCode);
    const cdCodeValid = isValidRequiredValue(cdCode);
    const isAtLeastOneICDCodeFilled =
      iCodeValid || lCodeValid || eCodeValid || cdCodeValid;
    if (!isAtLeastOneICDCodeFilled) return true;

    // CPT Code 1 & Wound Size 1 must be valid
    if (!isValidRequiredValue(cptCode)) return true;
    if (!isPositiveNumber(cptWoundSize1)) return true;

    // (CPT Code 2 & Wound Size 2 are optional – remove these checks)

    return false;
  }, [
    practitioner,
    ivr?.account?.NPI,
    products,
    selectedCompany,
    primaryMemberNumber,
    primaryGroupNumber,
    iCode,
    lCode,
    eCode,
    cdCode,
    cptCode,
    cptWoundSize1,
  ]);

  const isSubmitDisabled = isRequiredFieldMissing || isReadOnly;

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
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
        id="open-ivr-btn"
        fullWidth
        onClick={handleButtonClick}
        style={{
          background: "#266787",
          color: "white",
        }}
      >
        {isReadOnly ? "View IVR" : "Open IVR"}
      </Button>

      <Dialog
        id="ivr-dialog"
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
        <DialogTitle style={{ backgroundColor: "#15706A", color: "white" }}>
          IVR
        </DialogTitle>

        <DialogContent
          id="ivr-dialog-content"
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

            {/* Practitioner Select */}
            <Select
              id="practitioner-select"
              fullWidth
              value={practitioner || ""}
              onChange={handlePractitioner}
              disabled={isReadOnly}
            >
              {practitionerList.map((pr) => (
                <MenuItem
                  id={`practitioner-${pr.___USR}`}
                  key={pr.___USR}
                  value={pr}
                >
                  {pr.NameFull}
                </MenuItem>
              ))}
            </Select>

            {/* NPI Field */}
            <TextField
              id="npi-field"
              label="NPI"
              fullWidth
              margin="dense"
              size="small"
              value={ivr.account?.NPI || ""}
              disabled={isReadOnly}
            />

            {/* Product Select */}
            <Select
              id="product-select"
              fullWidth
              value={products || ""}
              onChange={handleProductChange}
              disabled={isReadOnly}
            >
              {productsList.map((product) => (
                <MenuItem
                  id={`product-${product?.QCode}`}
                  key={product?.QCode}
                  value={product}
                >
                  {product?.Name}
                </MenuItem>
              ))}
            </Select>

            {/* Primary Payor */}
            <Autocomplete
              id="primary-payor-select"
              options={[...CompanyNames, "Other"]}
              getOptionLabel={(option) => option}
              value={selectedCompany}
              onChange={handleCompanyChange}
              disabled={isReadOnly}
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
              id="primary-member-number"
              label="Primary Member Number"
              fullWidth
              margin="dense"
              value={primaryMemberNumber}
              onChange={(e) => handleMemberNumber(true, e)}
              size="small"
              disabled={isReadOnly}
            />

            <TextField
              id="primary-group-number"
              label="Primary Group Number"
              fullWidth
              margin="dense"
              value={primaryGroupNumber}
              onChange={(e) => handleGroupNumber(true, e)}
              size="small"
              disabled={isReadOnly}
            />

            {/* Secondary Payor (Optional) */}
            <Autocomplete
              id="secondary-payor-select"
              options={[...CompanyNames, "Other"]}
              getOptionLabel={(option) => option}
              value={selectedCompanySecond}
              onChange={handleCompanyChangeSecond}
              disabled={isReadOnly}
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
              id="secondary-member-number"
              label="Secondary Member Number"
              fullWidth
              margin="dense"
              value={secondaryMemberNumber}
              onChange={(e) => handleMemberNumber(false, e)}
              size="small"
              disabled={isReadOnly}
            />

            <TextField
              id="secondary-group-number"
              label="Secondary Group Number"
              fullWidth
              margin="dense"
              value={secondaryGroupNumber}
              onChange={(e) => handleGroupNumber(false, e)}
              size="small"
              disabled={isReadOnly}
            />

            {/* ICD10 Codes */}
            <Typography variant="h6" mt={3}>
              ICD10 Codes:
            </Typography>
            <Grid container spacing={2} marginTop={1} id="grid-container-1">
              <Grid item xs={3} id="grid-item-Icode">
                <Autocomplete
                  id="i-code-select"
                  options={iCodes}
                  getOptionLabel={(option) => option}
                  value={iCode}
                  onChange={handleICodeChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField {...params} label="I Code" margin="normal" />
                  )}
                />
              </Grid>
              <Grid item xs={3} id="grid-item-Lcode">
                <Autocomplete
                  id="l-code-select"
                  options={lCodes}
                  getOptionLabel={(option) => option}
                  value={lCode}
                  onChange={handleLCodeChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField {...params} label="L Code" margin="normal" />
                  )}
                />
              </Grid>
              <Grid item xs={3} id="grid-item-Ecode">
                <Autocomplete
                  id="e-code-select"
                  options={eCodes}
                  getOptionLabel={(option) => option}
                  value={eCode}
                  onChange={handleECodeChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField {...params} label="E Code" margin="normal" />
                  )}
                />
              </Grid>
              <Grid item xs={3} id="grid-item-CDcode">
                <Autocomplete
                  id="cd-code-select"
                  options={mohsCodes}
                  getOptionLabel={(option) => option}
                  value={cdCode}
                  onChange={handleCDCodeChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField {...params} label="CD Code" margin="normal" />
                  )}
                />
              </Grid>
            </Grid>

            {/* CPT Codes */}
            <Typography variant="h6" mt={3}>
              CPT Code:
            </Typography>
            <Grid container spacing={2} marginTop={1} id="grid-container-2">
              <Grid item id="grid-item-WoundSize-1">
                <TextField
                  id="wound-size-1"
                  label="Wound Size 1"
                  type="number"
                  variant="outlined"
                  value={cptWoundSize1}
                  onChange={(e) => setCPTWoundSize1(e.target.value)}
                  sx={{ width: "100px" }}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item id="grid-item-CPTcode-1">
                <Autocomplete
                  id="cpt-code-1"
                  options={cptCodes}
                  getOptionLabel={(option) => option}
                  value={cptCode}
                  onChange={handleCPTCodeChange}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CPT Code"
                      variant="outlined"
                      sx={{ width: "150px" }}
                    />
                  )}
                />
              </Grid>
              <Grid item id="grid-item-WoundSize-2">
                <TextField
                  id="wound-size-2"
                  label="Wound Size 2"
                  type="number"
                  variant="outlined"
                  value={cptWoundSize2}
                  onChange={(e) => setCPTWoundSize2(e.target.value)}
                  sx={{ width: "100px" }}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item id="grid-item-CPTcode-2">
                <Autocomplete
                  id="cpt-code-2"
                  options={cptCodes}
                  getOptionLabel={(option) => option}
                  value={cptCode2}
                  onChange={(e, newValue) => setCPTCode2(newValue)}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CPT Code 2"
                      variant="outlined"
                      sx={{ width: "150px" }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Documents Section (Not Required) */}
            <Typography variant="h6" mt={3}>
              Documents:
            </Typography>
            {documents.length > 0 ? (
              <List id="documents-list">
                {documents?.map((item, index) => (
                  <ListItemButton
                    id={`document-item-${index}`}
                    key={index}
                    onClick={() => handleSecondDialogOpen(item)}
                    sx={{
                      borderBottom: "1px solid #00000033",
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      color: "black",
                      "&:hover": {
                        backgroundColor: "lightblue",
                      },
                    }}
                  >
                    <Typography variant="body2">{item?.Name}</Typography>
                    {!isReadOnly && (
                      <Delete
                        id={`delete-document-${index}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(item, index);
                        }}
                        style={{ color: "#EC5750", cursor: "pointer" }}
                      />
                    )}
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography variant="body2" mt={3}>
                No Documents Added
              </Typography>
            )}

            <Button
              id="add-documents-btn"
              onClick={handleDocumentDialogOpen}
              style={{
                width: "150px",
                height: "50px",
                borderRadius: "0px",
                background: "#D8EEDA",
                color: "#157069",
                marginRight: "20px",
              }}
              disabled={isReadOnly}
            >
              Add Documents
            </Button>

            {/* Reasons and Comments (Not Required) */}
            <Box display="flex" flexDirection="column">
              <Typography variant="h6" mt={3} mb={3}>
                Reasons:
              </Typography>
              <TextField
                id="reasons-input"
                rows={3}
                value={reasons}
                multiline
                onChange={(event) => setReasons(event.target.value)}
                fullWidth
                placeholder="Reasons"
                margin="10"
                disabled={isReadOnly}
              />

              <Typography variant="h6" mt={3} mb={3}>
                Comments:
              </Typography>
              <TextField
                id="comments-input"
                rows={3}
                value={comment}
                multiline
                onChange={(event) => setComment(event.target.value)}
                fullWidth
                placeholder="Comments"
                margin="10"
                disabled={isReadOnly}
              />
            </Box>

            {/* Action Buttons */}
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
                id="close-ivr-btn"
                onClick={handleDialogClose}
                style={{
                  width: "100px",
                  height: "50px",
                  borderRadius: "0px",
                  background: "#14706A",
                  color: "white",
                  marginRight: "20px",
                }}
              >
                Close
              </Button>

              {!isReadOnly && (
                <>
                  <Button
                    id="save-ivr-btn"
                    onClick={() => handleSubmit(null)}
                    style={{
                      width: "100px",
                      height: "50px",
                      borderRadius: "0px",
                      background: "#14706A",
                      color: "white",
                      marginRight: "20px",
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    id="submit-ivr-btn"
                    onClick={() => handleSubmit(1)}
                    disabled={isSubmitDisabled}
                    style={{
                      width: "100px",
                      height: "50px",
                      borderRadius: "0px",
                      background: isSubmitDisabled ? "#aaa" : "#14706A",
                      color: "white",
                      marginRight: "20px",
                      cursor: isSubmitDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    Submit
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* Document Preview Dialog */}
          <Dialog
            id="document-preview-dialog"
            open={secondDialogOpen}
            onClose={handleSecondDialogClose}
            PaperProps={{
              style: {
                minWidth: "70vw",
                height: "90%",
              },
            }}
          >
            <DialogTitle>Document</DialogTitle>
            <DialogContent style={{ width: "100%", height: "100%" }}>
              {selectedDocument && selectedDocument.Base64 ? (
                getMimeTypeFromDataUri(selectedDocument.Base64) ===
                "application/pdf" ? (
                  <iframe
                    id="pdf-preview-frame"
                    src={selectedDocument.Base64}
                    title="PDF Document"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                ) : (
                  <img
                    id="image-preview"
                    src={selectedDocument.Base64}
                    alt="Document"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )
              ) : (
                <Typography variant="body2">
                  No document available
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                id="close-preview-btn"
                onClick={handleSecondDialogClose}
                color="primary"
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Upload Document Dialog */}
          <Dialog
            id="document-upload-dialog"
            open={documentDialogOpen}
            onClose={handleDocumentDialogClose}
          >
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent style={{ width: "400px" }}>
              <TextField
                id="document-name-input"
                fullWidth
                margin="normal"
                label="Set Document Name"
                value={documentName}
                required
                error={errors.documentName}
                helperText={
                  errors.documentName ? "Document name is required" : ""
                }
                onChange={(e) => {
                  setDocumentName(e.target.value);
                  setErrors((prev) => ({ ...prev, documentName: false }));
                }}
              />

              <FormControl
                fullWidth
                margin="normal"
                error={errors.documentType}
                required
              >
                <InputLabel id="document-type-label">Document Type</InputLabel>
                <Select
                  id="document-type-select"
                  labelId="document-type-label"
                  value={documentType}
                  onChange={(e) => {
                    handleDocumentTypeChange(e);
                    setErrors((prev) => ({ ...prev, documentType: false }));
                  }}
                  label="Document Type"
                >
                  <MenuItem id="doc-type-facesheet" value="facesheet">
                    Facesheet
                  </MenuItem>
                  <MenuItem id="doc-type-wound" value="wound notes">
                    Wound Notes
                  </MenuItem>
                  <MenuItem id="doc-type-id" value="identification">
                    Identification
                  </MenuItem>
                  <MenuItem id="doc-type-auth" value="priorAuthorization">
                    Prior Authorization
                  </MenuItem>
                  <MenuItem id="doc-type-other" value="other">
                    Other
                  </MenuItem>
                </Select>
                {errors.documentType && (
                  <FormHelperText>
                    Document type is required
                  </FormHelperText>
                )}
              </FormControl>

              {documentType === "other" && (
                <TextField
                  id="other-document-type-input"
                  fullWidth
                  margin="normal"
                  label="Specify Document Type"
                  value={otherDocumentType}
                  required
                  error={errors.otherDocumentType}
                  helperText={
                    errors.otherDocumentType
                      ? "Please specify document type"
                      : ""
                  }
                  onChange={(e) => {
                    setOtherDocumentType(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      otherDocumentType: false,
                    }));
                  }}
                />
              )}

              <input
                id="file-upload-input"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                style={errors.selectedFiles ? { border: "1px solid red" } : {}}
              />
              {errors.selectedFiles && (
                <Typography color="error">
                  Please select a file to upload
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                id="cancel-upload-btn"
                onClick={handleDocumentDialogClose}
                color="primary"
              >
                Cancel
              </Button>
              <Button
                id="confirm-upload-btn"
                onClick={handleDocumentDialogSubmit}
                color="primary"
              >
                Upload
              </Button>
            </DialogActions>
          </Dialog>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CustomField;
