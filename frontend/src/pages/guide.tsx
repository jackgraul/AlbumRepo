import { Accordion, AccordionDetails, AccordionSummary, Typography, Slider, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box } from "@mui/system";
import { useState } from "react";

const scoreMarks = [0,1,2,3,4,5,6,7,8,9,10].map((value) => ({
    value,
    label: value.toString(),
}));

const scoreDescriptions: Record<number, string> = {
    0: "Disaster — completely unlistenable",
    1: "Awful — little to no redeeming qualities",
    2: "Poor — major problems throughout",
    3: "Bad — below average with significant flaws",
    4: "Below Average — some good qualities, but mostly lacking",
    5: "Average — solid but unremarkable",
    6: "Good — clearly above average",
    7: "Very Good — very strong with minor flaws",
    8: "Great — exceptional and highly memorable",
    9: "Amazing — outstanding in nearly every way",
    10: "Masterpiece — exceptional, defining, and nearly flawless",
};

const Guide: React.FC = () => {
    const [ratingCriteriaOpen, setRatingCriteriaOpen] = useState(false);
    const [openCriteria, setOpenCriteria] = useState<string | false>(false);
    const handleRatingCriteriaChange = (
        _event: React.SyntheticEvent,
        expanded: boolean
    ) => {
        setRatingCriteriaOpen(expanded);

        if (!expanded) {
            setOpenCriteria(false);
        }
    };

    return(
        <Box sx={{ p: 2, mx: "auto" }}>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Score Ranges</Typography>
                </AccordionSummary>

                <AccordionDetails>
                    <Box
                        sx={{
                            width: "100%",
                            px: 2,
                            py: 4,
                        }}
                    >
                        <Box sx={{ position: "relative", height: 50 }}>
                            <Slider
                                min={0}
                                max={10}
                                value={10}
                                disabled
                                sx={{
                                    position: "absolute",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "100%",

                                    "& .MuiSlider-thumb": {
                                        display: "none",
                                    },

                                    "& .MuiSlider-mark": {
                                        display: "none",
                                    },
                                }}
                            />

                            {scoreMarks.map((mark) => (
                                <Tooltip
                                    key={mark.value}
                                    title={scoreDescriptions[mark.value]}
                                    placement="top"
                                    arrow
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: "0.8rem"
                                            }
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: `${((mark.value) / 10) * 100}%`,
                                            top: "50%",
                                            transform: "translate(-50%, -50%)",

                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",

                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",

                                            backgroundColor: "background.paper",
                                            border: "2px solid",
                                            borderColor: "primary.main",

                                            fontSize: "0.9rem",
                                            fontWeight: 600,

                                            cursor: "help",

                                            zIndex: 2,

                                            "&:hover": {
                                                backgroundColor: "primary.main",
                                                color: "primary.contrastText"
                                            },
                                        }}
                                    >
                                        {mark.value}
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Accordion
                expanded={ratingCriteriaOpen}
                onChange={handleRatingCriteriaChange}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Rating Criteria</Typography>
                </AccordionSummary>

                <AccordionDetails>
                    <Accordion
                        expanded={openCriteria === "songwriting"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "songwriting" ? false : "songwriting"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Songwriting</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                This is subjective and hard to define but how is the songwriting
                                on the album? Are the lyrics engaging and well-crafted? Is there a
                                narrative or theme that runs through the album? Are the melodies
                                and harmonies well-constructed?
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        expanded={openCriteria === "sequencing"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "sequencing" ? false : "sequencing"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Sequencing</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Does the sequencing of the album elevate the experience? Are the
                                transitions between songs smooth? Is the pacing and flow of the
                                album well thought out? Does the track order enhance the overall
                                narrative or theme of the album?
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        expanded={openCriteria === "consistency"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "consistency" ? false : "consistency"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Consistency</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                How is the overall consistency of the album? Are there any weak
                                tracks that detract from the overall experience?
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        expanded={openCriteria === "memorability"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "memorability" ? false : "memorability"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Memorability</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                How memorable is the album? Do the songs stick in your mind long
                                after listening? Are there any standout moments or hooks that make
                                the album particularly memorable?
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        expanded={openCriteria === "performances"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "performances" ? false : "performances"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Performances</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Are there any standout performances on the album? Excellent riffs,
                                solos, bass lines, drum work, vocals, etc. are a plus.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion
                        expanded={openCriteria === "production"}
                        onChange={() =>
                            setOpenCriteria(
                                openCriteria === "production" ? false : "production"
                            )
                        }
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Production</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                How is the production quality of the album? Is it well-mixed and
                                mastered? There is a fine line for production for me. It mustn't
                                be too polished or overproduced, but it also must not be too raw
                                or unpolished.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

export default Guide;